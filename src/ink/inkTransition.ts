/**
 * Adapted from Codemure's ink-bleed-theme-changer (MIT License, Copyright (c) 2026 Codemure)
 * https://github.com/codemure-official/ink-bleed-theme-changer
 */
import { toggleThemeValue, type ThemeMode } from '../utils/theme';
import { capturePage, layoutKey, renderScale } from './capture';
import { inkParams, SPREAD } from './params';
import { InkRenderer, type InkFrame, type InkSource } from './renderer';

export interface Point {
  x: number;
  y: number;
}

const FADE_OUT_S = 0.15;
const RESIZE_DEBOUNCE_MS = 250;
/** CSS cross-fade used without WebGL2 or before snapshots are ready. */
const CSS_FADE_S = 0.42;

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

export interface InkTransitionOptions {
  canvas: HTMLCanvasElement;
  getTheme: () => ThemeMode;
  applyTheme: (next: ThemeMode) => void;
  webgl?: boolean;
}

/**
 * Orchestrates the ink-bleed theme transition:
 *  1. Keeps fresh snapshots of both themes on the GPU (pre-captured, re-captured on layout change).
 *  2. On toggle, covers the viewport with the "from" snapshot, flips the live DOM underneath,
 *     spreads the organic ink across the viewport, then fades the overlay away.
 *  3. If toggled mid-spread, freezes the current GPU frame and spreads the opposite ink over it.
 *  4. Falls back cleanly to a CSS cross-fade without WebGL2 or before snapshots are ready,
 *     and to a quick accessible switch under `prefers-reduced-motion: reduce`.
 */
export class InkTransition {
  private readonly renderer: InkRenderer | null;
  private readonly getTheme: () => ThemeMode;
  private readonly applyTheme: (next: ThemeMode) => void;
  private readonly reducedMotionMql: MediaQueryList | null;

  private frame: ActiveFrame | null = null;
  private elapsedSeconds = 0;
  private rafId = 0;
  private fadeRafId = 0;
  private cssFadeTimer = 0;
  private resizeTimer = 0;
  private captureGen = 0;
  private capturing = false;
  private captureQueued = false;
  private disposed = false;

  private readonly onResize: () => void;
  private readonly onReducedMotionChange: () => void;
  private readonly resizeObserver: ResizeObserver | null;

  constructor(options: InkTransitionOptions) {
    this.getTheme = options.getTheme;
    this.applyTheme = options.applyTheme;
    this.reducedMotionMql =
      typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;

    this.onResize = () => {
      if (this.disposed) return;
      this.renderer?.resize(renderScale());
      if (this.frame) this.draw();
      this.scheduleCapture(RESIZE_DEBOUNCE_MS);
    };

    this.onReducedMotionChange = () => {
      if (this.disposed) return;
      if (this.prefersReducedMotion()) {
        this.cancel();
      } else {
        this.scheduleCapture(0);
      }
    };

    this.renderer =
      options.webgl === false ? null : InkRenderer.create(options.canvas);

    if (!this.renderer) {
      document.documentElement.dataset.ink = 'css';
      this.resizeObserver = null;
      return;
    }

    document.documentElement.dataset.ink = 'webgl';
    this.renderer.resize(renderScale());
    this.renderer.watchContext(
      () => this.cancel(),
      () => this.scheduleCapture(0)
    );

    window.addEventListener('resize', this.onResize, { passive: true });
    this.reducedMotionMql?.addEventListener?.(
      'change',
      this.onReducedMotionChange
    );

    // Re-capture when document height changes (late images, Gumroad catalogue injection, FAQ accordion).
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        if (!this.disposed) {
          this.scheduleCapture(RESIZE_DEBOUNCE_MS);
        }
      });
      this.resizeObserver.observe(document.body);
    } else {
      this.resizeObserver = null;
    }

    // Kick off offscreen pre-capture once fonts settle (skipped if reduced motion is on).
    const startCapture = () => {
      if (!this.disposed) this.scheduleCapture(0);
    };
    if (document.fonts && typeof document.fonts.ready?.then === 'function') {
      void document.fonts.ready.then(startCapture);
    } else {
      startCapture();
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
    const renderer = this.renderer;
    const scale = renderScale();
    const key = layoutKey(scale);
    const interrupting = this.frame !== null;

    const canAnimate =
      renderer !== null &&
      !renderer.isLost &&
      !this.prefersReducedMotion() &&
      renderer.hasValid(to, key) &&
      (interrupting || renderer.hasValid(current, key));

    if (!canAnimate || !renderer) {
      this.cancel();
      this.crossFade(to);
      if (renderer && !this.prefersReducedMotion()) {
        this.scheduleCapture(0);
      }
      return;
    }

    // If interrupted mid-spread, freeze what is currently on screen and spread the new ink over it.
    let from: InkSource = current;
    if (interrupting) {
      this.stopLoops();
      renderer.resize(scale);
      const frozen = this.currentFrame();
      from = frozen && renderer.freeze(frozen) ? 'composite' : current;
    }

    const maxDist = farthestCorner(
      point,
      document.documentElement.clientWidth,
      document.documentElement.clientHeight
    );
    const seed = randomSeed();

    this.frame = { from, to, center: point, maxDist, seed };
    this.elapsedSeconds = 0;

    renderer.resize(scale);
    this.draw();

    // Same task: show the overlay (displaying "from") and flip the live DOM underneath.
    renderer.canvas.style.opacity = '1';
    renderer.canvas.classList.add('is-active');
    this.applyTheme(to);

    const duration = inkParams.duration;
    let lastTimestamp = performance.now();

    const step = (now: number) => {
      if (this.disposed || !this.frame) return;
      const dt = Math.max(0, Math.min(0.1, (now - lastTimestamp) / 1000));
      lastTimestamp = now;
      this.elapsedSeconds += dt * inkParams.timeScale;

      if (this.elapsedSeconds >= duration) {
        this.elapsedSeconds = duration;
        this.draw();
        this.rafId = 0;
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
    window.clearTimeout(this.cssFadeTimer);
    window.clearTimeout(this.resizeTimer);
    document.documentElement.classList.remove('theme-fade');
    window.removeEventListener('resize', this.onResize);
    this.reducedMotionMql?.removeEventListener?.(
      'change',
      this.onReducedMotionChange
    );
    this.resizeObserver?.disconnect();
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

  private draw(): void {
    const frame = this.currentFrame();
    if (this.renderer && frame) {
      this.renderer.draw(frame);
    }
  }

  private finish(): void {
    const canvas = this.renderer?.canvas;
    if (!canvas) {
      this.hide();
      return;
    }

    const fadeStart = performance.now();
    const fadeDurationMs = (FADE_OUT_S * 1000) / Math.max(0.01, inkParams.timeScale);

    const fadeStep = (now: number) => {
      if (this.disposed || !this.frame) return;
      const t = Math.min(1, (now - fadeStart) / fadeDurationMs);
      canvas.style.opacity = String(1 - t);
      if (t >= 1) {
        this.fadeRafId = 0;
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
    if (this.captureQueued && !this.disposed) {
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
   * - No WebGL2 or pre-capture still in progress: smooth CSS color cross-fade.
   */
  private crossFade(to: ThemeMode): void {
    const root = document.documentElement;
    if (this.prefersReducedMotion()) {
      root.classList.remove('theme-fade');
      this.applyTheme(to);
      return;
    }

    root.classList.add('theme-fade');
    root.style.setProperty('--theme-fade', `${CSS_FADE_S}s`);
    this.applyTheme(to);

    window.clearTimeout(this.cssFadeTimer);
    this.cssFadeTimer = window.setTimeout(() => {
      root.classList.remove('theme-fade');
      if (this.captureQueued && !this.disposed) {
        this.scheduleCapture(0);
      }
    }, CSS_FADE_S * 1000 + 50);
  }

  // ---------- Capture scheduling ----------

  private scheduleCapture(delay: number): void {
    if (this.disposed) return;
    window.clearTimeout(this.resizeTimer);
    this.resizeTimer = window.setTimeout(() => {
      void this.captureAll();
    }, delay);
  }

  private async captureAll(): Promise<void> {
    const renderer = this.renderer;
    if (this.disposed || !renderer || renderer.isLost || this.prefersReducedMotion()) {
      return;
    }
    // Never capture mid-animation or mid CSS fade (would bake half-transitioned colors).
    if (
      this.capturing ||
      this.frame ||
      document.documentElement.classList.contains('theme-fade')
    ) {
      this.captureQueued = true;
      return;
    }

    const scale = renderScale();
    const key = layoutKey(scale);
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
        if (snap.key !== layoutKey(renderScale())) {
          // Layout changed while capturing; this snapshot is already stale.
          this.captureQueued = true;
          break;
        }
        renderer.upload(snap);
      }
    } catch {
      // Snapshot capture failure gracefully degrades to CSS cross-fade fallback.
    } finally {
      this.capturing = false;
    }

    if (this.captureQueued && !this.disposed) {
      this.scheduleCapture(RESIZE_DEBOUNCE_MS);
    }
  }
}
