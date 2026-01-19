/**
 * Caching Service
 * Implements in-memory caching with TTL for usage and subscription data
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class CachingService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly USAGE_CACHE_TTL = 30 * 1000; // 30 seconds
  private readonly SUBSCRIPTION_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private pendingRequests: Map<string, Promise<any>> = new Map();

  /**
   * Get cached usage statistics
   */
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

  /**
   * Set cached usage statistics
   */
  setCachedUsage(userId: string, stats: any): Promise<void> {
    const key = `usage:${userId}`;
    this.cache.set(key, {
      data: stats,
      expiresAt: Date.now() + this.USAGE_CACHE_TTL,
    });
    return Promise.resolve();
  }

  /**
   * Get cached subscription status
   */
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

  /**
   * Set cached subscription status
   */
  setCachedSubscription(userId: string, status: any): Promise<void> {
    const key = `subscription:${userId}`;
    this.cache.set(key, {
      data: status,
      expiresAt: Date.now() + this.SUBSCRIPTION_CACHE_TTL,
    });
    return Promise.resolve();
  }

  /**
   * Invalidate usage cache for a user
   */
  invalidateUsageCache(userId: string): Promise<void> {
    const key = `usage:${userId}`;
    this.cache.delete(key);
    return Promise.resolve();
  }

  /**
   * Invalidate subscription cache for a user
   */
  invalidateSubscriptionCache(userId: string): Promise<void> {
    const key = `subscription:${userId}`;
    this.cache.delete(key);
    return Promise.resolve();
  }

  /**
   * Request deduplication - ensures only one request is made for the same data
   */
  async deduplicateRequest<T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    // If there's already a pending request, wait for it
    const pending = this.pendingRequests.get(key);
    if (pending) {
      return pending;
    }

    // Create new request
    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  /**
   * Clear all cache entries
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt <= now) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton instance
export const cachingService = new CachingService();

// Cleanup expired entries every minute
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cachingService.cleanup();
  }, 60 * 1000);
}
