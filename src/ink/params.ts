/**
 * Adapted from Codemure's ink-bleed-theme-changer (MIT License, Copyright (c) 2026 Codemure)
 * https://github.com/codemure-official/ink-bleed-theme-changer
 */
import type { ThemeMode } from '../utils/theme';

export interface InkParams {
  /** Seconds for the spread (before the 150ms fade). */
  duration: number;
  /** Tendril reach multiplier, 0 = clean blob. */
  tendril: number;
  /** Noise frequency multiplier: lower = bigger, lazier shapes. */
  noiseScale: number;
  /** Frontier half-width in CSS px. */
  softness: number;
  /** Speed at which the shape evolves during the spread. */
  drift: number;
  /** Global playback rate. */
  timeScale: number;
}

export const inkParams: InkParams = {
  duration: 1.4,
  tendril: 1,
  noiseScale: 1,
  softness: 1.4,
  drift: 1,
  timeScale: 1,
};

/**
 * Spread shape over time.
 * - `growth`: base radius at progress 1 relative to the farthest corner.
 * - `cleanupFrom`: fraction of the (linear) duration after which a uniform extra reach
 *   eats whatever the noise left behind, guaranteeing full coverage at t = 1.
 * - `cleanupReach`: that extra reach at t = 1, relative to the farthest corner.
 */
export const SPREAD = {
  growth: 0.7,
  cleanupFrom: 0.45,
  cleanupReach: 0.4,
  cleanupPow: 2,
} as const;

/** Storefront page canvas backgrounds for each theme. */
export const THEME_BG: Record<ThemeMode, string> = {
  light: '#FFF7E8',
  dark: '#181613',
};

/**
 * Pigment colour pooled at the advancing ink frontier, tuned to Faraz Kayan's
 * warm paper (#FFF7E8) and warm deep charcoal-ink (#181613) themes.
 */
export const RIM_COLOR: Record<ThemeMode, [number, number, number]> = {
  dark: [0.055, 0.048, 0.042], // dense warm ink slightly darker than #181613
  light: [1.0, 0.988, 0.955], // warm ivory bleach slightly brighter than #FFF7E8
};
