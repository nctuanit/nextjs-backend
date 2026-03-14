export interface CacheStore {
  set(key: string, value: any, ttl?: number): Promise<void> | void;
  get<T = any>(key: string): Promise<T | undefined> | T | undefined;
  del(key: string): Promise<void> | void;
  reset(): Promise<void> | void;
}

export class MemoryCacheStore implements CacheStore {
  private cache = new Map<string, { value: any; expiry: number }>();

  set(key: string, value: any, ttl?: number): void {
    const expiry = ttl ? Date.now() + ttl : Infinity;
    this.cache.set(key, { value, expiry });
  }

  get<T = any>(key: string): T | undefined {
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
