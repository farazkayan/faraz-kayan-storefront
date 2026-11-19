/**
 * Zero-iframe, CSP-safe, taint-safe viewport rasterizer for the WebGL2 ink-bleed transition.
 *
 * Gumroad hosts custom HTML inside a sandboxed iframe (`sandbox="allow-scripts ..."` without
 * `allow-same-origin` and `Content-Security-Policy: default-src 'none'`), which blocks
 * html2canvas-pro's internal DocumentCloner `<iframe>`. This rasterizer paints the visible
 * viewport directly onto an offscreen 2D canvas using live `getComputedStyle()` and
 * `getBoundingClientRect()` with zero iframes, zero network requests, and full CORS taint guards.
 */
import type { ThemeMode } from '../utils/theme';
import type { Snapshot } from './capture';
import { inkDebug } from './debug';
import { THEME_BG } from './params';

let cachedIframeSupport: boolean | null = null;

/**
 * Probes whether the current browsing context permits creating and scripting a same-origin
 * hidden `<iframe>` (required by html2canvas-pro's DocumentCloner).
 * Returns `false` inside Gumroad's opaque-origin sandboxed iframe so we never stall.
 */
export function canUseIframeCloner(): boolean {
  if (cachedIframeSupport !== null) return cachedIframeSupport;
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    cachedIframeSupport = false;
    return false;
  }
  // Opaque sandboxed iframes (missing allow-same-origin) report origin === 'null'.
  if (window.origin === 'null') {
    cachedIframeSupport = false;
    return false;
  }
  if (!document.body) return false;

  let probe: HTMLIFrameElement | null = null;
  try {
    probe = document.createElement('iframe');
    probe.style.cssText =
      'position:fixed;width:0;height:0;border:0;visibility:hidden;pointer-events:none;';
    document.body.appendChild(probe);
    const doc = probe.contentDocument;
    const win = probe.contentWindow;
    cachedIframeSupport = Boolean(doc && win && doc.documentElement);
  } catch {
    cachedIframeSupport = false;
  } finally {
    probe?.remove();
  }
  return cachedIframeSupport;
}

const SKIP_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'NOSCRIPT',
  'TEMPLATE',
  'META',
  'LINK',
  'HEAD',
  'TITLE',
]);

function isTransparent(color: string | null | undefined): boolean {
  if (!color || color === 'transparent' || color === 'none') return true;
  if (color === 'rgba(0, 0, 0, 0)') return true;
  const match = color.match(/rgba?\([^)]+,\s*([0-9.]+)\s*\)/);
  if (match && Number(match[1]) === 0) return true;
  return false;
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
): void {
  const r = Math.max(0, Math.min(radius, w / 2, h / 2));
  ctx.beginPath();
  if (r <= 0.5) {
    ctx.rect(x, y, w, h);
  } else {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
  }
  ctx.closePath();
}

/**
 * Tests whether drawing `img` onto a 2D canvas would taint it (preventing WebGL texImage2D).
 */
function canDrawImageWithoutTaint(img: HTMLImageElement): boolean {
  if (!img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) {
    return false;
  }
  const src = img.currentSrc || img.src || '';
  if (src.startsWith('data:') || src.startsWith('blob:')) {
    return true;
  }
  try {
    const probe = document.createElement('canvas');
    probe.width = 1;
    probe.height = 1;
    const pctx = probe.getContext('2d');
    if (!pctx) return false;
    pctx.drawImage(img, 0, 0, 1, 1);
    pctx.getImageData(0, 0, 1, 1);
    return true;
  } catch {
    return false;
  }
}

function paintElementBox(
  ctx: CanvasRenderingContext2D,
  el: Element,
  style: CSSStyleDeclaration,
  rect: DOMRect
): void {
  const bg = style.backgroundColor;
  const borderW = parseFloat(style.borderTopWidth) || 0;
  const borderColor = style.borderTopColor;
  const borderBottomW = parseFloat(style.borderBottomWidth) || 0;
  const borderBottomColor = style.borderBottomColor;
  const radius = parseFloat(style.borderTopLeftRadius) || 0;
  const hasBg = !isTransparent(bg);
  const hasBorder = borderW > 0 && !isTransparent(borderColor);
  const hasBottomBorder = borderBottomW > 0 && !isTransparent(borderBottomColor);

  // Paint offset sketch-card shadow if present (e.g., "3px 3px 0px rgb(...)")
  const shadow = style.boxShadow;
  if (hasBg && shadow && shadow !== 'none') {
    const shadowMatch = shadow.match(
      /(rgba?\([^)]+\)|#[0-9a-fA-F]+)\s+(-?[0-9.]+)px\s+(-?[0-9.]+)px/
    );
    if (shadowMatch) {
      const [, sColor, sx, sy] = shadowMatch;
      const dx = parseFloat(sx);
      const dy = parseFloat(sy);
      if (dx !== 0 || dy !== 0) {
        ctx.save();
        ctx.fillStyle = sColor;
        drawRoundedRectPath(ctx, rect.left + dx, rect.top + dy, rect.width, rect.height, radius);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  if (hasBg) {
    ctx.save();
    ctx.fillStyle = bg;
    drawRoundedRectPath(ctx, rect.left, rect.top, rect.width, rect.height, radius);
    ctx.fill();
    ctx.restore();
  }

  if (hasBorder) {
    ctx.save();
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderW;
    drawRoundedRectPath(
      ctx,
      rect.left + borderW / 2,
      rect.top + borderW / 2,
      Math.max(0, rect.width - borderW),
      Math.max(0, rect.height - borderW),
      radius
    );
    ctx.stroke();
    ctx.restore();
  } else if (hasBottomBorder) {
    ctx.save();
    ctx.strokeStyle = borderBottomColor;
    ctx.lineWidth = borderBottomW;
    ctx.beginPath();
    ctx.moveTo(rect.left, rect.bottom - borderBottomW / 2);
    ctx.lineTo(rect.right, rect.bottom - borderBottomW / 2);
    ctx.stroke();
    ctx.restore();
  }
}

function paintImageElement(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  style: CSSStyleDeclaration,
  rect: DOMRect
): void {
  const radius = parseFloat(style.borderTopLeftRadius) || 0;
  ctx.save();
  drawRoundedRectPath(ctx, rect.left, rect.top, rect.width, rect.height, radius);
  ctx.clip();

  if (canDrawImageWithoutTaint(img)) {
    const objectFit = style.objectFit || 'fill';
    if (objectFit === 'cover' || objectFit === 'contain') {
      const scaleX = rect.width / img.naturalWidth;
      const scaleY = rect.height / img.naturalHeight;
      const ratio =
        objectFit === 'cover' ? Math.max(scaleX, scaleY) : Math.min(scaleX, scaleY);
      const drawW = img.naturalWidth * ratio;
      const drawH = img.naturalHeight * ratio;
      const drawX = rect.left + (rect.width - drawW) / 2;
      const drawY = rect.top + (rect.height - drawH) / 2;
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
    } else {
      ctx.drawImage(img, rect.left, rect.top, rect.width, rect.height);
    }
  } else {
    // Fallback neutral fill for untrusted cross-origin images so WebGL texImage2D never taints.
    const bg = !isTransparent(style.backgroundColor)
      ? style.backgroundColor
      : 'rgba(128, 120, 110, 0.16)';
    ctx.fillStyle = bg;
    ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
  }
  ctx.restore();
}

function paintTextNodes(
  ctx: CanvasRenderingContext2D,
  el: Element,
  style: CSSStyleDeclaration,
  vw: number,
  vh: number
): void {
  const color = style.color;
  if (isTransparent(color)) return;

  const fontSize = parseFloat(style.fontSize) || 16;
  const fontWeight = style.fontWeight || '400';
  const fontStyle = style.fontStyle === 'italic' ? 'italic ' : '';
  const fontFamily = style.fontFamily || 'sans-serif';

  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${fontStyle}${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.textBaseline = 'top';

  for (let node = el.firstChild; node; node = node.nextSibling) {
    if (node.nodeType !== Node.TEXT_NODE) continue;
    const raw = node.textContent;
    if (!raw || !raw.trim()) continue;

    const range = document.createRange();
    range.selectNodeContents(node);
    const rects = range.getClientRects();
    if (rects.length === 0) continue;

    const text = raw.replace(/\s+/g, ' ').trim();
    if (rects.length === 1) {
      const r = rects[0]!;
      if (r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) continue;
      const yOffset = Math.max(0, (r.height - fontSize) * 0.42);
      ctx.fillText(text, r.left, r.top + yOffset, r.width + 4);
    } else {
      // Multi-line wrapped text: walk word chunks to approximate line placement quickly.
      const words = text.split(' ');
      let wordIdx = 0;
      for (let i = 0; i < rects.length && wordIdx < words.length; i++) {
        const r = rects[i]!;
        if (r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) continue;
        let line = words[wordIdx++]!;
        while (wordIdx < words.length) {
          const candidate = `${line} ${words[wordIdx]}`;
          if (ctx.measureText(candidate).width <= r.width + 6) {
            line = candidate;
            wordIdx++;
          } else {
            break;
          }
        }
        const yOffset = Math.max(0, (r.height - fontSize) * 0.42);
        ctx.fillText(line, r.left, r.top + yOffset, r.width + 8);
      }
    }
  }
  ctx.restore();
}

/**
 * Captures the currently visible viewport directly into a taint-free 2D canvas.
 * Runs synchronously in ~8–25ms with zero iframes and zero network dependencies.
 */
export function rasterizeViewport(
  theme: ThemeMode,
  scale: number,
  maxTextureSize: number
): Snapshot {
  const t0 = performance.now();
  const vw = Math.max(1, document.documentElement.clientWidth || window.innerWidth);
  const vh = Math.max(1, document.documentElement.clientHeight || window.innerHeight);
  const safeScale = Math.max(
    0.5,
    Math.min(scale, maxTextureSize / vw, maxTextureSize / vh)
  );

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(vw * safeScale));
  canvas.height = Math.max(1, Math.round(vh * safeScale));

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to create 2D context for viewport rasterizer');
  }

  ctx.scale(safeScale, safeScale);
  ctx.fillStyle = THEME_BG[theme];
  ctx.fillRect(0, 0, vw, vh);

  const walk = (el: Element): void => {
    if (SKIP_TAGS.has(el.tagName)) return;
    if (el.classList.contains('ink-canvas')) return;

    const rect = el.getBoundingClientRect();
    // Skip zero-size elements unless they have children (e.g., display: contents)
    if (
      (rect.width === 0 && rect.height === 0) &&
      el.children.length === 0
    ) {
      return;
    }

    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return;
    const opacity = parseFloat(style.opacity);
    if (opacity <= 0.01) return;

    const intersectsViewport =
      rect.bottom >= -4 && rect.top <= vh + 4 && rect.right >= -4 && rect.left <= vw + 4;

    if (intersectsViewport && rect.width > 0 && rect.height > 0) {
      ctx.save();
      if (opacity < 0.99) ctx.globalAlpha *= opacity;

      paintElementBox(ctx, el, style, rect);

      if (el.tagName === 'IMG') {
        paintImageElement(ctx, el as HTMLImageElement, style, rect);
      } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        const input = el as HTMLInputElement;
        const val = input.value || input.placeholder || '';
        if (val) {
          const padLeft = parseFloat(style.paddingLeft) || 12;
          const fontSize = parseFloat(style.fontSize) || 14;
          ctx.fillStyle = input.value ? style.color : 'rgba(128, 120, 110, 0.7)';
          ctx.font = `${style.fontWeight || '400'} ${fontSize}px ${style.fontFamily || 'sans-serif'}`;
          ctx.textBaseline = 'middle';
          ctx.fillText(val, rect.left + padLeft, rect.top + rect.height / 2, Math.max(0, rect.width - padLeft * 2));
        }
      } else if (el.tagName !== 'SVG' && el.tagName !== 'svg') {
        paintTextNodes(ctx, el, style, vw, vh);
      }

      ctx.restore();
    }

    // Descend into children (skip SVG internals)
    if (el.tagName !== 'SVG' && el.tagName !== 'svg') {
      for (let child = el.firstElementChild; child; child = child.nextElementSibling) {
        walk(child);
      }
    }
  };

  if (document.body) {
    walk(document.body);
  }

  const ms = performance.now() - t0;
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  const key = `vp:${vw}x${vh}@${safeScale}:${Math.round(scrollX)},${Math.round(scrollY)}`;

  inkDebug('G', 'Direct viewport rasterizer completed', {
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
}
