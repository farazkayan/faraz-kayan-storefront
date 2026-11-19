/**
 * Adapted from Codemure's ink-bleed-theme-changer (MIT License, Copyright (c) 2026 Codemure)
 * https://github.com/codemure-official/ink-bleed-theme-changer
 */
import { toggleThemeValue, type ThemeMode } from '../utils/theme';
import {
  capturePage,
  loadHtml2CanvasPro,
  renderScale,
  viewportKey,
} from './capture';
import { inkDebug, inkDebugError } from './debug';
import { inkParams, SPREAD } from './params';
import { InkRenderer, type InkFrame, type InkSource } from './renderer';
import { canUseIframeCloner, rasterizeViewport } from './viewportRasterizer';

export interface Point {
  x: number;
  y: number;
}

const FADE_OUT_S = 0.15;
const RESIZE_DEBOUNCE_MS = 300;
/** CSS cross-fade used only when WebGL2 is unavailable or fails. */
const CSS_FADE_S = 0.35;

type ActiveFrame = Omit<InkFrame, 'progress' | 'radius' | 'time' | 'cleanup'>;

/** Exact equivalent of GSAP's power3.out easing curve. */
export function easePower3Out(t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  const inv = 1 - clamped;
  return 1 - inv * inv * inv;
}

/**
 * Computes the ink base radius and end-of-spread cleanup reach for a given elapsed
 * time in seconds, matching Codemure's exact spread envelope.
 */
export function computeSpreadMetrics(
  elapsedSeconds: number,
  durationSeconds: number,
  maxDist: number
): { progress: number; radius: number; cleanup: number } {
  const linear =
    durationSeconds > 0
      ? Math.max(0, Math.min(1, elapsedSeconds / durationSeconds))
      : 1;
  const progress = easePower3Out(linear);
  const ramp = Math.max(
    0,
    (linear - SPREAD.cleanupFrom) / (1 - SPREAD.cleanupFrom)
  );
  // Second term acts in the last ~3% (~40ms) so unlucky seeds still reach 100% coverage.
  const cleanup =
    ramp ** SPREAD.cleanupPow * maxDist * SPREAD.cleanupReach +
    Math.max(0, (linear - 0.97) / 0.03) * maxDist;
  const radius = progress * maxDist * SPREAD.growth;
  return { progress, radius, cleanup };
}

/** Distance from origin point to the farthest corner of a viewport box. */
export function farthestCorner(
  point: Point,
  viewportWidth: number,
  viewportHeight: number
): number {
  return (
    Math.max(
      Math.hypot(point.x, point.y),
      Math.hypot(viewportWidth - point.x, point.y),
      Math.hypot(point.x, viewportHeight - point.y),
      Math.hypot(viewportWidth - point.x, viewportHeight - point.y)
    ) + 4
  );
}

/**
 * Resolves the ink origin from a button click event:
 * - Pointer activation (`detail > 0` with non-zero coordinates): exact pointer position.
 * - Keyboard activation (`detail === 0` or zeroed coordinates): toggle button center.
 */
export function resolveToggleOrigin(
  event: { detail: number; clientX: number; clientY: number },
  buttonRect: { left: number; top: number; width: number; height: number } | null,
  fallbackViewport: { width: number; height: number }
): Point {
  const isPointer =
    event.detail > 0 && (event.clientX !== 0 || event.clientY !== 0);
  if (isPointer) {
    return { x: event.clientX, y: event.clientY };
  }
  if (buttonRect && (buttonRect.width > 0 || buttonRect.height > 0)) {
    return {
      x: buttonRect.left + buttonRect.width / 2,
      y: buttonRect.top + buttonRect.height / 2,
    };
  }
  return {
    x: fallbackViewport.width / 2,
    y: fallbackViewport.height / 2,
  };
}

function randomSeed(): InkFrame['seed'] {
  return {
    x: Math.random() * 64 - 32,
    y: Math.random() * 64 - 32,
    angle: Math.random() * Math.PI * 2,
  };
}

function scheduleIdle(cb: () => void, timeoutMs = 1500): number {
  if (typeof window === 'undefined') return 0;
  const w = window as Window & {
    requestIdleCallback?: (
      callback: () => void,
      options?: { timeout: number }
    ) => number;
  };
  if (typeof w.requestIdleCallback === 'function') {
    return w.requestIdleCallback(cb, { timeout: timeoutMs });
  }
  return window.setTimeout(cb, 250);
}

function cancelIdle(id: number): void {
  if (!id || typeof window === 'undefined') return;
  const w = window as Window & { cancelIdleCallback?: (handle: number) => void };
  if (typeof w.cancelIdleCallback === 'function') {
    w.cancelIdleCallback(id);
  } else {
    window.clearTimeout(id);
  }
}

export interface InkTransitionOptions {
  canvas: HTMLCanvasElement;
  getTheme: () => ThemeMode;
  applyTheme: (next: ThemeMode) => void;
  webgl?: boolean;
}

/**
 * Orchestrates the ink-bleed theme transition:
 *  1. On non-sandboxed hosts, preloads html2canvas-pro & prepares viewport snapshots during idle time.
 *  2. On toggle:
 *     - If fresh dual-theme viewport snapshots exist, runs the exact opaque dual-texture shader.
 *     - Otherwise (including inside Gumroad's strict CSP sandboxed iframe where DocumentCloner's
 *       internal iframe is blocked, or on immediate first-click), captures the visible viewport
 *       directly via `rasterizeViewport()` (~10-25ms, zero iframes, taint-safe) and runs the
 *       exact Codemure WebGL2 ink-bleed shader in live-DOM alpha-reveal mode.
 *  3. Only falls back to CSS cross-fade when WebGL2 is unavailable/lost or reduced motion is enabled.
 */
export class InkTransition {
  private readonly renderer: InkRenderer | null;
  private readonly getTheme: () => ThemeMode;
  private readonly applyTheme: (next: ThemeMode) => void;
  private readonly reducedMotionMql: MediaQueryList | null;
  private readonly iframeClonerAllowed: boolean;

  private frame: ActiveFrame | null = null;
  private elapsedSeconds = 0;
  private rafId = 0;
  private fadeRafId = 0;
  private cssFadeTimer = 0;
  private resizeTimer = 0;
  private idleHandle = 0;
  private captureGen = 0;
  private capturing = false;
  private captureQueued = false;
  private disposed = false;

  private readonly onResize: () => void;
  private readonly onReducedMotionChange: () => void;

  constructor(options: InkTransitionOptions) {
    this.getTheme = options.getTheme;
    this.applyTheme = options.applyTheme;
    this.reducedMotionMql =
      typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;
    this.iframeClonerAllowed = canUseIframeCloner();

    inkDebug('L', 'Ink overlay canvas mounted in DOM', {
      connected: options.canvas.isConnected,
      iframeClonerAllowed: this.iframeClonerAllowed,
      origin: typeof window !== 'undefined' ? window.origin : 'unknown',
    });

    this.onResize = () => {
      if (this.disposed) return;
      this.renderer?.resize(renderScale());
      if (this.frame) this.draw();
      if (this.iframeClonerAllowed) {
        this.scheduleCapture(RESIZE_DEBOUNCE_MS);
      }
    };

    this.onReducedMotionChange = () => {
      if (this.disposed) return;
      if (this.prefersReducedMotion()) {
        this.cancel();
      } else if (this.iframeClonerAllowed) {
        this.scheduleIdlePreload();
      }
    };

    this.renderer =
      options.webgl === false ? null : InkRenderer.create(options.canvas);

    if (!this.renderer) {
      document.documentElement.dataset.ink = 'css';
      inkDebug('Q', 'WebGL2 unavailable at init — CSS fallback armed');
      return;
    }

    document.documentElement.dataset.ink = 'webgl';
    this.renderer.resize(renderScale());
    this.renderer.watchContext(
      () => this.cancel(),
      () => {
        if (this.iframeClonerAllowed) this.scheduleCapture(0);
      }
    );

    window.addEventListener('resize', this.onResize, { passive: true });
    this.reducedMotionMql?.addEventListener?.(
      'change',
      this.onReducedMotionChange
    );

    // Preload html2canvas-pro and viewport snapshots only when iframe cloning is permitted.
    // Inside Gumroad's opaque-origin CSP sandbox, we skip html2canvas-pro completely so
    // it never stalls, and use the instant zero-iframe direct viewport rasterizer instead.
    if (this.iframeClonerAllowed && !this.prefersReducedMotion()) {
      const startIdle = () => {
        if (!this.disposed) this.scheduleIdlePreload();
      };
      if (document.fonts && typeof document.fonts.ready?.then === 'function') {
        void document.fonts.ready.then(startIdle);
      } else {
        startIdle();
      }
    }
  }

  get isWebGL(): boolean {
    return this.renderer !== null;
  }

  get isAnimating(): boolean {
    return this.frame !== null;
  }

  private prefersReducedMotion(): boolean {
    return Boolean(this.reducedMotionMql?.matches);
  }

  /**
   * Toggle the theme, spreading organically from `point` (viewport CSS px).
   */
  toggle(point: Point): void {
    if (this.disposed) return;
    const current = this.getTheme();
    const to = toggleThemeValue(current);

    inkDebug('A', 'Theme toggle received', {
      origin: { x: Math.round(point.x), y: Math.round(point.y) },
      currentTheme: current,
    });
    inkDebug('B', 'Target theme determined', { targetTheme: to });

    if (this.prefersReducedMotion()) {
      inkDebug('Q', 'Fallback activated: prefers-reduced-motion is enabled');
      this.cancel();
      this.crossFade(to);
      return;
    }

    const renderer = this.renderer;
    if (!renderer || renderer.isLost) {
      inkDebug('Q', 'Fallback activated: WebGL2 renderer unavailable or context lost');
      this.cancel();
      this.crossFade(to);
      return;
    }

    const scale = renderScale();
    const key = viewportKey(scale);
    const interrupting = this.frame !== null;
    const hasDualSnapshots =
      renderer.hasValid(to, key) &&
      (interrupting || renderer.hasValid(current, key));

    let from: InkSource = current;
    let revealAlpha = false;

    if (hasDualSnapshots) {
      // Path 1: Pre-captured dual-theme viewport snapshots are ready.
      if (interrupting) {
        this.stopLoops();
        renderer.resize(scale);
        const frozen = this.currentFrame();
        from = frozen && renderer.freeze(frozen) ? 'composite' : current;
      }
    } else {
      // Path 2: Instant zero-iframe direct viewport capture + live-DOM alpha-reveal WebGL2 ink.
      // Works immediately on first click and inside Gumroad's strict CSP sandboxed iframe.
      if (interrupting) {
        this.hide();
      }
      try {
        const snapshot = rasterizeViewport(
          current,
          scale,
          renderer.maxTextureSize
        );
        const uploaded = renderer.upload(snapshot);
        if (!uploaded) {
          throw new Error('WebGL2 texture upload returned false');
        }
        from = current;
        revealAlpha = true;
      } catch (err) {
        inkDebugError(
          'Q',
          'Fallback activated: direct viewport rasterization/upload failed',
          err
        );
        this.cancel();
        this.crossFade(to);
        return;
      }
    }

    const vw = document.documentElement.clientWidth || window.innerWidth;
    const vh = document.documentElement.clientHeight || window.innerHeight;
    const maxDist = farthestCorner(point, vw, vh);
    const seed = randomSeed();

    this.frame = { from, to, revealAlpha, center: point, maxDist, seed };
    this.elapsedSeconds = 0;

    renderer.resize(scale);
    const drewFirst = this.draw();
    if (!drewFirst) {
      inkDebug('Q', 'Fallback activated: initial WebGL2 draw failed');
      this.cancel();
      this.crossFade(to);
      return;
    }

    // Same task: show the overlay (displaying the old theme) and flip the live DOM underneath.
    renderer.canvas.style.opacity = '1';
    renderer.canvas.classList.add('is-active');

    const canvasRect = renderer.canvas.getBoundingClientRect();
    const canvasStyle = window.getComputedStyle(renderer.canvas);
    inkDebug('M', 'Ink canvas activated', {
      mode: revealAlpha ? 'webgl-alpha-reveal' : 'webgl-dual-texture',
      visibility: canvasStyle.visibility,
      opacity: canvasStyle.opacity,
      zIndex: canvasStyle.zIndex,
      rect: {
        width: Math.round(canvasRect.width),
        height: Math.round(canvasRect.height),
      },
      backingStore: {
        width: renderer.canvas.width,
        height: renderer.canvas.height,
      },
    });

    this.applyTheme(to);
    inkDebug('P', 'Target theme committed to live DOM', { theme: to });

    const duration = inkParams.duration;
    let lastTimestamp = performance.now();
    let loggedFirstFrame = false;
    let loggedMidpoint = false;

    const step = (now: number) => {
      if (this.disposed || !this.frame) return;
      const dt = Math.max(0, Math.min(0.1, (now - lastTimestamp) / 1000));
      lastTimestamp = now;
      this.elapsedSeconds += dt * inkParams.timeScale;

      if (!loggedFirstFrame) {
        loggedFirstFrame = true;
        inkDebug('N', 'First animation frame rendered', {
          elapsedMs: Number((this.elapsedSeconds * 1000).toFixed(1)),
        });
      }

      if (!loggedMidpoint && this.elapsedSeconds >= duration * 0.5) {
        loggedMidpoint = true;
        inkDebug('O', 'Animation reached midpoint', {
          progress: Number(
            easePower3Out(this.elapsedSeconds / duration).toFixed(3)
          ),
        });
      }

      if (this.elapsedSeconds >= duration) {
        this.elapsedSeconds = duration;
        this.draw();
        this.rafId = 0;
        inkDebug('O', 'Ink spread completed — starting overlay fade-out', {
          durationS: duration,
        });
        this.finish();
        return;
      }

      this.draw();
      this.rafId = window.requestAnimationFrame(step);
    };

    this.rafId = window.requestAnimationFrame(step);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.captureGen++;
    this.cancel();
    cancelIdle(this.idleHandle);
    this.idleHandle = 0;
    window.clearTimeout(this.cssFadeTimer);
    window.clearTimeout(this.resizeTimer);
    document.documentElement.classList.remove('theme-fade');
    window.removeEventListener('resize', this.onResize);
    this.reducedMotionMql?.removeEventListener?.(
      'change',
      this.onReducedMotionChange
    );
    this.renderer?.dispose();
  }

  // ---------- internals ----------

  private stopLoops(): void {
    if (this.rafId) {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
    if (this.fadeRafId) {
      window.cancelAnimationFrame(this.fadeRafId);
      this.fadeRafId = 0;
    }
  }

  private currentFrame(): InkFrame | null {
    if (!this.frame) return null;
    const { progress, radius, cleanup } = computeSpreadMetrics(
      this.elapsedSeconds,
      inkParams.duration,
      this.frame.maxDist
    );
    return {
      ...this.frame,
      progress,
      time: this.elapsedSeconds,
      radius,
      cleanup,
    };
  }

  private draw(): boolean {
    const frame = this.currentFrame();
    if (this.renderer && frame) {
      return this.renderer.draw(frame);
    }
    return false;
  }

  private finish(): void {
    const canvas = this.renderer?.canvas;
    if (!canvas) {
      this.hide();
      return;
    }

    const fadeStart = performance.now();
    const fadeDurationMs =
      (FADE_OUT_S * 1000) / Math.max(0.01, inkParams.timeScale);

    const fadeStep = (now: number) => {
      if (this.disposed || !this.frame) return;
      const t = Math.min(1, (now - fadeStart) / fadeDurationMs);
      canvas.style.opacity = String(1 - t);
      if (t >= 1) {
        this.fadeRafId = 0;
        inkDebug('O', 'Overlay fade-out completed and cleaned up');
        this.hide();
        return;
      }
      this.fadeRafId = window.requestAnimationFrame(fadeStep);
    };

    this.fadeRafId = window.requestAnimationFrame(fadeStep);
  }

  private hide(): void {
    this.stopLoops();
    this.frame = null;
    if (this.renderer) {
      this.renderer.canvas.classList.remove('is-active');
      this.renderer.canvas.style.opacity = '';
    }
    if (this.captureQueued && this.iframeClonerAllowed && !this.disposed) {
      this.scheduleCapture(0);
    }
  }

  private cancel(): void {
    if (!this.frame && !this.rafId && !this.fadeRafId) return;
    this.hide();
  }

  /**
   * Fallback theme switch:
   * - Reduced motion: instant, accessible flip with no animation.
   * - WebGL2 unavailable/lost: brief scoped CSS color cross-fade.
   */
  private crossFade(to: ThemeMode): void {
    const root = document.documentElement;
    if (this.prefersReducedMotion()) {
      root.classList.remove('theme-fade');
      this.applyTheme(to);
      inkDebug('P', 'Final theme committed (reduced motion)', { theme: to });
      return;
    }

    root.classList.add('theme-fade');
    root.style.setProperty('--theme-fade', `${CSS_FADE_S}s`);
    this.applyTheme(to);
    inkDebug('P', 'Final theme committed (CSS fallback)', { theme: to });

    window.clearTimeout(this.cssFadeTimer);
    this.cssFadeTimer = window.setTimeout(() => {
      root.classList.remove('theme-fade');
    }, CSS_FADE_S * 1000 + 50);
  }

  // ---------- Idle preloading & viewport pre-capture (non-sandboxed hosts) ----------

  private scheduleIdlePreload(): void {
    if (this.disposed || !this.iframeClonerAllowed) return;
    cancelIdle(this.idleHandle);
    this.idleHandle = scheduleIdle(() => {
      this.idleHandle = 0;
      if (this.disposed || this.prefersReducedMotion()) return;
      void loadHtml2CanvasPro()
        .then(() => {
          if (!this.disposed) this.scheduleCapture(0);
        })
        .catch(() => {
          // Direct viewport rasterizer remains available even if CDN preload fails.
        });
    }, 1500);
  }

  private scheduleCapture(delay: number): void {
    if (this.disposed || !this.iframeClonerAllowed) return;
    window.clearTimeout(this.resizeTimer);
    this.resizeTimer = window.setTimeout(() => {
      void this.captureAll();
    }, delay);
  }

  private async captureAll(): Promise<void> {
    const renderer = this.renderer;
    if (
      this.disposed ||
      !this.iframeClonerAllowed ||
      !renderer ||
      renderer.isLost ||
      this.prefersReducedMotion()
    ) {
      return;
    }
    if (
      this.capturing ||
      this.frame ||
      document.documentElement.classList.contains('theme-fade')
    ) {
      this.captureQueued = true;
      return;
    }

    const scale = renderScale();
    const key = viewportKey(scale);
    const current = this.getTheme();
    const other = toggleThemeValue(current);
    const themes: ThemeMode[] = [current, other].filter(
      (t) => !renderer.hasValid(t, key)
    );

    this.captureQueued = false;
    if (themes.length === 0) return;

    const gen = ++this.captureGen;
    this.capturing = true;
    try {
      for (const theme of themes) {
        if (this.disposed || gen !== this.captureGen) return;
        const snap = await capturePage(theme, scale, renderer.maxTextureSize);
        if (this.disposed || gen !== this.captureGen) return;
        if (snap.key !== viewportKey(renderScale())) {
          this.captureQueued = true;
          break;
        }
        renderer.upload(snap);
      }
    } catch {
      // Direct viewport rasterizer handles transitions cleanly without stalling.
    } finally {
      this.capturing = false;
    }

    if (this.captureQueued && !this.disposed) {
      this.scheduleCapture(RESIZE_DEBOUNCE_MS);
    }
  }
}
