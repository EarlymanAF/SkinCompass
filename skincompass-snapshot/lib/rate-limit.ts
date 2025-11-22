// lib/rate-limit.ts
// Sehr einfacher globaler Throttler: min. GAP zwischen Steam-Requests.
let last = 0;

// Warte mind. gapMs seit dem letzten Call
export async function throttle(gapMs = 1500) {
  const now = Date.now();
  const wait = Math.max(0, last + gapMs - now);
  if (wait > 0) {
    await new Promise((r) => setTimeout(r, wait));
  }
  last = Date.now();
}

// Exponential Backoff für 429/5xx
export async function fetchWithRetry(
  url: string,
  init: RequestInit = {},
  tries = 4
): Promise<Response> {
  let attempt = 0;
  let err: unknown = null;
  while (attempt < tries) {
    try {
      await throttle(); // drosseln
      const res = await fetch(url, init);
      if (res.status === 429 || res.status >= 500) {
        throw new Error(`HTTP ${res.status}`);
      }
      return res;
    } catch (e) {
      err = e;
      attempt++;
      if (attempt >= tries) break;
      // Backoff: 600ms, 1200ms, 2400ms ...
      const delay = 600 * Math.pow(2, attempt - 1);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw err instanceof Error ? err : new Error("fetchWithRetry failed");
}