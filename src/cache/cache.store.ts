export interface CacheStore {
  set(key: string, value: unknown, ttl?: number): Promise<void> | void;
  get<T = unknown>(key: string): Promise<T | undefined> | T | undefined;
  del(key: string): Promise<void> | void;
  reset(): Promise<void> | void;
}

export class MemoryCacheStore implements CacheStore {
  private cache = new Map<string, { value: unknown; expiry: number }>();
  private readonly maxSize: number;

  constructor(maxSize = 10_000) {
    this.maxSize = maxSize;
  }

  set(key: string, value: unknown, ttl?: number): void {
    // Evict oldest entry when at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    const expiry = ttl && ttl > 0 ? Date.now() + ttl : Infinity;
    this.cache.set(key, { value, expiry });
  }

  get<T = unknown>(key: string): T | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return undefined;
    }

    return item.value as T;
  }

  del(key: string): void {
    this.cache.delete(key);
  }

  reset(): void {
    this.cache.clear();
  }
}
