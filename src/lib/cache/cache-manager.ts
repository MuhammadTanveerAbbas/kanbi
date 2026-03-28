interface CacheEntry<T> {
  data: T;
  expiry: number;
}

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>();

  set<T>(key: string, data: T, ttlMs: number): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlMs,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  invalidate(pattern: string): void {
    const keys = Array.from(this.cache.keys());
    keys.forEach(key => {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

export const cacheManager = new CacheManager();

export const CACHE_KEYS = {
  USAGE: (userId: string) => `usage:${userId}`,
  ANALYTICS: (userId: string) => `analytics:${userId}`,
  TASK_STATS: (userId: string) => `task-stats:${userId}`,
};

export const CACHE_TTL = {
  USAGE: 5 * 60 * 1000,
  ANALYTICS: 10 * 60 * 1000,
  TASK_STATS: 5 * 60 * 1000,
};
