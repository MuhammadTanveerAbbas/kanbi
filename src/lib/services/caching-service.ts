/**
 * In-memory cache with TTL for usage and subscription data.
 * Includes request deduplication to prevent thundering-herd on cold cache.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class CachingService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly USAGE_CACHE_TTL = 30 * 1000;
  private readonly SUBSCRIPTION_CACHE_TTL = 5 * 60 * 1000;
  private pendingRequests: Map<string, Promise<any>> = new Map();

  getCachedUsage(userId: string): Promise<any | null> {
    const key = `usage:${userId}`;
    const entry = this.cache.get(key);

    if (entry && entry.expiresAt > Date.now()) {
      return Promise.resolve(entry.data);
    }

    if (entry) {
      this.cache.delete(key);
    }

    return Promise.resolve(null);
  }

  setCachedUsage(userId: string, stats: any): Promise<void> {
    const key = `usage:${userId}`;
    this.cache.set(key, {
      data: stats,
      expiresAt: Date.now() + this.USAGE_CACHE_TTL,
    });
    return Promise.resolve();
  }

  getCachedSubscription(userId: string): Promise<any | null> {
    const key = `subscription:${userId}`;
    const entry = this.cache.get(key);

    if (entry && entry.expiresAt > Date.now()) {
      return Promise.resolve(entry.data);
    }

    if (entry) {
      this.cache.delete(key);
    }

    return Promise.resolve(null);
  }

  setCachedSubscription(userId: string, status: any): Promise<void> {
    const key = `subscription:${userId}`;
    this.cache.set(key, {
      data: status,
      expiresAt: Date.now() + this.SUBSCRIPTION_CACHE_TTL,
    });
    return Promise.resolve();
  }

  invalidateUsageCache(userId: string): Promise<void> {
    const key = `usage:${userId}`;
    this.cache.delete(key);
    return Promise.resolve();
  }

  invalidateSubscriptionCache(userId: string): Promise<void> {
    const key = `subscription:${userId}`;
    this.cache.delete(key);
    return Promise.resolve();
  }

  /**
   * Deduplicates concurrent requests for the same key — only one fetch fires,
   * all callers await the same promise.
   */
  async deduplicateRequest<T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    const pending = this.pendingRequests.get(key);
    if (pending) {
      return pending;
    }
    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  clearCache(): void {
    this.cache.clear();
  }

  /** Evicts expired entries — called automatically every 60 seconds. */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt <= now) {
        this.cache.delete(key);
      }
    }
  }
}

export const cachingService = new CachingService();

if (typeof setInterval !== 'undefined') {
  setInterval(() => cachingService.cleanup(), 60 * 1000);
}
