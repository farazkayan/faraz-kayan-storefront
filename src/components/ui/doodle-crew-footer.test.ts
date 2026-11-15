import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clamp,
  hash,
  layoutWord,
  lookAt,
  seatPoint,
  stepFloater,
  timeline,
  type Floater,
} from './doodle-crew-footer';

test('hash and clamp remain deterministic and bounded', () => {
  const h = hash(3.14);
  assert.ok(h >= 0 && h < 1);
  assert.equal(hash(3.14), h);
  assert.equal(clamp(-5, 0, 10), 0);
  assert.equal(clamp(15, 0, 10), 10);
  assert.equal(clamp(4, 0, 10), 4);
});

test('layoutWord handles wordmark with space and ignores bad advances', () => {
  const result = layoutWord([120, 140, Number.NaN, -10, 130], -0.02, 200);
  assert.equal(result.x.length, 5);
  assert.equal(result.w[2], 0);
  assert.equal(result.w[3], 0);
  assert.ok(result.width > 0);
});

test('seatPoint positions crew accurately for front, top, and behind seats', () => {
  assert.deepEqual(seatPoint('front', 100, 80, 146, 0, 1), { x: 140, y: 0 });
  assert.deepEqual(seatPoint('top', 100, 80, 146, 0.25, 1), { x: 160, y: -146 });
  assert.deepEqual(seatPoint('behind', 100, 80, 146, 0, 1), { x: 140, y: -116 });
});

test('lookAt caps pupil excursion inside eye bounds', () => {
  const offset = lookAt(0, 0, 1000, 0, 3.6, 220);
  assert.ok(Math.hypot(offset.x, offset.y) <= 3.6001);
  assert.deepEqual(lookAt(10, 10, 10, 10, 3.6, 220), { x: 0, y: 0 });
});

test('stepFloater updates drift and handles pop respawn cleanly', () => {
  const f: Floater = {
    x: 100,
    y: 50,
    vx: 0,
    vy: 10,
    rot: 0,
    vr: 0,
    fall: 12,
    phase: 0,
    pop: 0.02,
  };
  const next = stepFloater(f, 0.05, 1, 1000, 500, 110, 60, 110, () => 0.5);
  assert.equal(next.pop, 0);
  assert.equal(next.x, 500);
  assert.equal(next.y, -40);
});

test('timeline produces strictly ordered arrival cues for 11-char FARAZ KAYAN', () => {
  const tl = timeline(11, 6, 10, 2);
  assert.ok(tl.ground < tl.letter(0));
  assert.ok(tl.letter(10) < tl.crewStart);
  assert.ok(tl.crewStart <= tl.member(0));
  assert.ok(tl.member(5) < tl.total);
});
