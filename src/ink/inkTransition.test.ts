import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HTML2CANVAS_PRO_CDN_URL,
  HTML2CANVAS_PRO_VERSION,
} from './capture';
import { isInkDebugEnabled } from './debug';
import {
  computeSpreadMetrics,
  easePower3Out,
  farthestCorner,
  resolveToggleOrigin,
} from './inkTransition';
import { inkParams, RIM_COLOR, SPREAD, THEME_BG } from './params';
import { canUseIframeCloner } from './viewportRasterizer';

test('ink diagnostics default off and iframe cloner probe is SSR-safe', () => {
  assert.equal(isInkDebugEnabled(), false);
  assert.equal(canUseIframeCloner(), false);
});

test('HTML2CANVAS_PRO_CDN_URL uses a pinned versioned jsDelivr ESM URL', () => {
  assert.match(HTML2CANVAS_PRO_VERSION, /^\d+\.\d+\.\d+$/);
  assert.equal(
    HTML2CANVAS_PRO_CDN_URL,
    `https://cdn.jsdelivr.net/npm/html2canvas-pro@${HTML2CANVAS_PRO_VERSION}/+esm`
  );
  assert.ok(!HTML2CANVAS_PRO_CDN_URL.includes('@latest'));
});

test('easePower3Out matches exact cubic out easing boundaries and monotonicity', () => {
  assert.equal(easePower3Out(0), 0);
  assert.equal(easePower3Out(1), 1);
  assert.equal(easePower3Out(-0.5), 0);
  assert.equal(easePower3Out(1.5), 1);
  assert.equal(easePower3Out(0.5), 0.875);
  assert.ok(easePower3Out(0.25) < easePower3Out(0.5));
  assert.ok(easePower3Out(0.5) < easePower3Out(0.75));
});

test('computeSpreadMetrics guarantees full viewport coverage at t = duration', () => {
  const maxDist = 1400;
  const start = computeSpreadMetrics(0, inkParams.duration, maxDist);
  assert.equal(start.progress, 0);
  assert.equal(start.radius, 0);
  assert.equal(start.cleanup, 0);

  const mid = computeSpreadMetrics(
    inkParams.duration * 0.4,
    inkParams.duration,
    maxDist
  );
  assert.ok(mid.progress > 0.7);
  assert.equal(mid.cleanup, 0); // cleanup starts after SPREAD.cleanupFrom (0.45)

  const end = computeSpreadMetrics(inkParams.duration, inkParams.duration, maxDist);
  assert.equal(end.progress, 1);
  assert.ok(Math.abs(end.radius - maxDist * SPREAD.growth) < 1e-6);
  // At end, radius + cleanup easily exceeds maxDist so no corner is left uncovered.
  assert.ok(end.radius + end.cleanup > maxDist * 1.9);
});

test('farthestCorner returns distance to the farthest viewport corner plus padding', () => {
  const distFromTopRight = farthestCorner({ x: 1000, y: 30 }, 1200, 800);
  const expected = Math.hypot(1000, 770) + 4;
  assert.ok(Math.abs(distFromTopRight - expected) < 1e-6);
});

test('resolveToggleOrigin uses pointer coordinates for clicks and button center for keyboard', () => {
  const buttonRect = { left: 900, top: 14, width: 84, height: 36 };
  const viewport = { width: 1200, height: 800 };

  // Pointer click
  const pointerOrigin = resolveToggleOrigin(
    { detail: 1, clientX: 932, clientY: 28 },
    buttonRect,
    viewport
  );
  assert.deepEqual(pointerOrigin, { x: 932, y: 28 });

  // Keyboard Enter/Space activation (detail === 0)
  const keyboardOrigin = resolveToggleOrigin(
    { detail: 0, clientX: 0, clientY: 0 },
    buttonRect,
    viewport
  );
  assert.deepEqual(keyboardOrigin, { x: 942, y: 32 });

  // Fallback when button rect is unavailable
  const fallbackOrigin = resolveToggleOrigin(
    { detail: 0, clientX: 0, clientY: 0 },
    null,
    viewport
  );
  assert.deepEqual(fallbackOrigin, { x: 600, y: 400 });
});

test('storefront ink theme tokens match Faraz Kayan light and dark palette', () => {
  assert.equal(THEME_BG.light, '#FFF7E8');
  assert.equal(THEME_BG.dark, '#181613');
  assert.equal(RIM_COLOR.dark.length, 3);
  assert.equal(RIM_COLOR.light.length, 3);
});
