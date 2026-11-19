/**
 * Opt-in diagnostics for the ink-bleed theme transition pipeline.
 * Activated via `?inkdebug=1` (in location.search or document.referrer) or `window.__INK_DEBUG__ = true`.
 */

declare global {
  interface Window {
    __INK_DEBUG__?: boolean;
  }
}

export function isInkDebugEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.__INK_DEBUG__ === true) return true;
  try {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('inkdebug') === '1') return true;
  } catch {
    // Ignore malformed query strings
  }
  try {
    if (typeof document !== 'undefined' && document.referrer) {
      const refUrl = new URL(document.referrer);
      if (refUrl.searchParams.get('inkdebug') === '1') return true;
    }
  } catch {
    // Ignore invalid referrer URLs
  }
  return false;
}

export function inkDebug(
  stage: string,
  message: string,
  details?: Record<string, unknown>
): void {
  if (!isInkDebugEnabled()) return;
  if (details) {
    console.info(`[INK DEBUG] [${stage}] ${message}`, details);
  } else {
    console.info(`[INK DEBUG] [${stage}] ${message}`);
  }
}

export function inkDebugError(
  stage: string,
  message: string,
  error?: unknown,
  details?: Record<string, unknown>
): void {
  if (!isInkDebugEnabled()) return;
  console.warn(`[INK DEBUG] [${stage}] ${message}`, {
    ...(details ?? {}),
    error:
      error instanceof Error
        ? { name: error.name, message: error.message }
        : error,
  });
}
