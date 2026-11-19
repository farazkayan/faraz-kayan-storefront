/**
 * Adapted from Codemure's ink-bleed-theme-changer (MIT License, Copyright (c) 2026 Codemure)
 * https://github.com/codemure-official/ink-bleed-theme-changer
 *
 * Viewport-sized snapshots of the storefront in a given theme using html2canvas-pro
 * (which supports Tailwind CSS v4 oklab/oklch/color-mix color functions).
 *
 * Capturing only the visible viewport avoids expensive full-document renders and
 * oversized GPU textures. In sandboxed environments where DocumentCloner's internal
 * iframe is blocked by CSP (such as Gumroad's /landing/embed), `canUseIframeCloner()`
 * short-circuits so the zero-iframe direct viewport rasterizer runs instantaneously.
 */
import type html2canvasType from 'html2canvas-pro';
import type { ThemeMode } from '../utils/theme';
import { inkDebug, inkDebugError } from './debug';
import { THEME_BG } from './params';

export const HTML2CANVAS_PRO_VERSION = '2.6.4';
export const HTML2CANVAS_PRO_CDN_URL = `https://cdn.jsdelivr.net/npm/html2canvas-pro@${HTML2CANVAS_PRO_VERSION}/+esm`;

const CAPTURE_TIMEOUT_MS = 2500;

type Html2CanvasFn = typeof html2canvasType;

let html2canvasPromise: Promise<Html2CanvasFn> | null = null;

/**
 * Loads html2canvas-pro at runtime from the pinned jsDelivr ESM CDN.
 * Cached after first successful load so it is downloaded at most once per page.
 * Clears the cached promise on failure so transient network issues do not stick.
 */
export function loadHtml2CanvasPro(): Promise<Html2CanvasFn> {
  if (!html2canvasPromise) {
    const moduleUrl = HTML2CANVAS_PRO_CDN_URL;
    inkDebug('C', 'html2canvas-pro import started', { url: moduleUrl });
    const t0 = performance.now();
    html2canvasPromise = (
      import(/* @vite-ignore */ moduleUrl) as Promise<{
        default?: Html2CanvasFn;
      }>
    )
      .then((mod) => {
        if (typeof mod?.default !== 'function') {
          throw new Error(
            'html2canvas-pro ESM module did not export default function'
          );
        }
        inkDebug('D', 'html2canvas-pro import completed', {
          ms: Number((performance.now() - t0).toFixed(1)),
        });
        return mod.default;
      })
      .catch((err) => {
        html2canvasPromise = null;
        inkDebugError('D', 'html2canvas-pro import failed', err, {
          url: moduleUrl,
        });
        throw err;
      });
  }
  return html2canvasPromise;
}

export interface Snapshot {
  theme: ThemeMode;
  canvas: HTMLCanvasElement;
  /** Texture pixels per CSS pixel. */
  scale: number;
  /** Layout + scroll key this snapshot is valid for; see {@link viewportKey}. */
  key: string;
  ms: number;
  /** True when snapshot covers the visible viewport starting at (scrollX, scrollY). */
  isViewport: boolean;
  scrollX: number;
  scrollY: number;
}

const isCoarsePointer = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(pointer: coarse)').matches;

/** Device-pixel ratio used for both the snapshots and the overlay canvas. */
export function renderScale(): number {
  const cap = isCoarsePointer() ? 1.5 : 2;
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  return Math.min(dpr, cap);
}

export function viewportSize(): { width: number; height: number } {
  const el = document.documentElement;
  return {
    width: Math.max(1, el.clientWidth || window.innerWidth),
    height: Math.max(1, el.clientHeight || window.innerHeight),
  };
}

/**
 * Identifies the viewport box and scroll offset a viewport snapshot corresponds to.
 */
export function viewportKey(scale: number): string {
  const { width, height } = viewportSize();
  const sx = typeof window !== 'undefined' ? Math.round(window.scrollX) : 0;
  const sy = typeof window !== 'undefined' ? Math.round(window.scrollY) : 0;
  return `vp:${width}x${height}@${scale}:${sx},${sy}`;
}

export async function capturePage(
  theme: ThemeMode,
  scale: number,
  maxTextureSize: number
): Promise<Snapshot> {
  const t0 = performance.now();
  const { width, height } = viewportSize();
  const scrollX = typeof window !== 'undefined' ? window.scrollX : 0;
  const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;
  const key = viewportKey(scale);

  // Never exceed what the GPU can hold; the shader handles scale != canvas DPR.
  const safeScale = Math.max(
    0.5,
    Math.min(scale, maxTextureSize / width, maxTextureSize / height)
  );

  inkDebug('E', 'html2canvas-pro viewport capture started', {
    theme,
    width,
    height,
    scrollX: Math.round(scrollX),
    scrollY: Math.round(scrollY),
    scale: safeScale,
  });

  const html2canvas = await loadHtml2CanvasPro();

  let timeoutId = 0;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(
        new Error(
          `html2canvas-pro viewport capture timed out after ${CAPTURE_TIMEOUT_MS}ms`
        )
      );
    }, CAPTURE_TIMEOUT_MS);
  });

  try {
    const canvas = await Promise.race([
      html2canvas(document.body, {
        scale: safeScale,
        backgroundColor: THEME_BG[theme],
        x: scrollX,
        y: scrollY,
        width,
        height,
        scrollX: -scrollX,
        scrollY: -scrollY,
        windowWidth: width,
        windowHeight: height,
        logging: false,
        useCORS: true,
        ignoreElements: (element) => element.classList.contains('ink-canvas'),
        onclone: (doc) => {
          if (theme === 'dark') {
            doc.documentElement.classList.add('dark');
          } else {
            doc.documentElement.classList.remove('dark');
          }
          doc.documentElement.classList.remove('theme-fade');
          doc.body.style.transition = 'none';
        },
      }),
      timeoutPromise,
    ]);

    const ms = performance.now() - t0;
    inkDebug('F', 'html2canvas-pro viewport capture completed', { theme });
    inkDebug('G', 'Viewport snapshot metrics', {
      theme,
      width: canvas.width,
      height: canvas.height,
      scale: safeScale,
      ms: Number(ms.toFixed(1)),
    });

    return {
      theme,
      canvas,
      scale: safeScale,
      key,
      ms,
      isViewport: true,
      scrollX,
      scrollY,
    };
  } catch (err) {
    inkDebugError('F', 'html2canvas-pro viewport capture failed', err, {
      theme,
      ms: Number((performance.now() - t0).toFixed(1)),
    });
    throw err;
  } finally {
    window.clearTimeout(timeoutId);
  }
}
