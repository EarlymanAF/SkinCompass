// lib/memo.ts

type Entry<T> = { value: T; expiresAt: number };
const store = new Map<string, Entry<unknown>>();

export function memoGet<T>(key: string): T | null {
  const hit = store.get(key);
  if (!hit) return null;
  if (hit.expiresAt < Date.now()) {
    store.delete(key);
    return null;
  }
  return hit.value as T;
}

export function memoSet<T>(key: string, value: T, ttlMs: number): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function memoizeAsync<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  ttlMs: number
) {
  const cache = new Map<string, Entry<TResult>>();

  return async (...args: TArgs): Promise<TResult> => {
    const key = JSON.stringify(args);
    const cached = cache.get(key);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const value = await fn(...args);
    cache.set(key, { value, expiresAt: Date.now() + ttlMs });
    return value;
  };
}
