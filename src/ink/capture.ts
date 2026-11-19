/**
 * Adapted from Codemure's ink-bleed-theme-changer (MIT License, Copyright (c) 2026 Codemure)
 * https://github.com/codemure-official/ink-bleed-theme-changer
 *
 * Full-document snapshots of the storefront in a given theme using html2canvas-pro
 * (which supports Tailwind CSS v4 oklab/oklch/color-mix color functions).
 *
 * We capture the whole document (not just the viewport) so a snapshot stays valid
 * while the user scrolls; the shader picks the visible window using the live scroll
 * offset. The theme class is applied to html2canvas-pro's cloned document via `onclone`,
 * so the live page never flickers during pre-capture.
 */
import type html2canvasType from 'html2canvas-pro';
import type { ThemeMode } from '../utils/theme';
import { THEME_BG } from './params';

export const HTML2CANVAS_PRO_VERSION = '2.6.4';
export const HTML2CANVAS_PRO_CDN_URL = `https://cdn.jsdelivr.net/npm/html2canvas-pro@${HTML2CANVAS_PRO_VERSION}/+esm`;

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
    html2canvasPromise = (
      import(/* @vite-ignore */ moduleUrl) as Promise<{
        default?: Html2CanvasFn;
      }>
    )
      .then((mod) => {
        if (typeof mod?.default !== 'function') {
          throw new Error('html2canvas-pro ESM module did not export default function');
        }
        return mod.default;
      })
      .catch((err) => {
        html2canvasPromise = null;
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
  /** Layout this snapshot is valid for; see {@link layoutKey}. */
  key: string;
  ms: number;
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

export function documentSize(): { width: number; height: number } {
  const el = document.documentElement;
  return {
    width: Math.max(1, el.clientWidth),
    height: Math.max(1, el.scrollHeight, el.clientHeight),
  };
}

/**
 * Identifies the layout a snapshot depends on. Viewport height is deliberately
 * excluded (mobile URL-bar show/hide changes it without reflowing the document).
 */
export function layoutKey(scale: number): string {
  const { width, height } = documentSize();
  return `${width}x${height}@${scale}`;
}

export async function capturePage(
  theme: ThemeMode,
  scale: number,
  maxTextureSize: number
): Promise<Snapshot> {
  const t0 = performance.now();
  const key = layoutKey(scale);
  const { width, height } = documentSize();

  // Never exceed what the GPU can hold; the shader handles scale != canvas DPR.
  const safeScale = Math.max(
    0.25,
    Math.min(scale, maxTextureSize / width, maxTextureSize / height)
  );

  // Loaded at runtime from pinned jsDelivr ESM so standalone HTML stays under Gumroad's 500k char limit.
  const html2canvas = await loadHtml2CanvasPro();
  const canvas = await html2canvas(document.body, {
    scale: safeScale,
    backgroundColor: THEME_BG[theme],
    x: 0,
    y: 0,
    width,
    height,
    scrollX: 0,
    scrollY: 0,
    // The clone iframe renders without a scrollbar, so give it the live page's
    // scrollbar-less width; otherwise centred content shifts by half a scrollbar.
    windowWidth: width,
    windowHeight: document.documentElement.clientHeight,
    logging: false,
    useCORS: true,
    ignoreElements: (element) => element.classList.contains('ink-canvas'),
    onclone: (doc) => {
      // Match Faraz Kayan storefront's Tailwind `.dark` class-based theming.
      if (theme === 'dark') {
        doc.documentElement.classList.add('dark');
      } else {
        doc.documentElement.classList.remove('dark');
      }
      doc.documentElement.classList.remove('theme-fade');
      // Prevent CSS transitions from baking half-transitioned colors into snapshots.
      doc.body.style.transition = 'none';
    },
  });

  return { theme, canvas, scale: safeScale, key, ms: performance.now() - t0 };
}
