import { cacheManager, CACHE_KEYS, CACHE_TTL } from '@/lib/cache/cache-manager'

describe('CacheManager', () => {
  beforeEach(() => {
    cacheManager.clear()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('set and get', () => {
    it('should set and retrieve data', () => {
      const key = 'test-key'
      const data = { id: 1, name: 'Test' }

      cacheManager.set(key, data, 60000)
      const result = cacheManager.get(key)

      expect(result).toEqual(data)
    })

    it('should return null for non-existent key', () => {
      const result = cacheManager.get('non-existent')
      expect(result).toBeNull()
    })

    it('should handle different data types', () => {
      cacheManager.set('string', 'value', 60000)
      cacheManager.set('number', 42, 60000)
      cacheManager.set('array', [1, 2, 3], 60000)
      cacheManager.set('object', { key: 'value' }, 60000)

      expect(cacheManager.get('string')).toBe('value')
      expect(cacheManager.get('number')).toBe(42)
      expect(cacheManager.get('array')).toEqual([1, 2, 3])
      expect(cacheManager.get('object')).toEqual({ key: 'value' })
    })
  })

  describe('TTL expiry', () => {
    it('should expire data after TTL', () => {
      const key = 'expiring-key'
      const data = { value: 'test' }
      const ttl = 5000

      cacheManager.set(key, data, ttl)
      expect(cacheManager.get(key)).toEqual(data)

      jest.advanceTimersByTime(ttl + 1)
      expect(cacheManager.get(key)).toBeNull()
    })

    it('should not expire data before TTL', () => {
      const key = 'persistent-key'
      const data = { value: 'test' }
      const ttl = 10000

      cacheManager.set(key, data, ttl)
      jest.advanceTimersByTime(5000)

      expect(cacheManager.get(key)).toEqual(data)
    })

    it('should handle zero TTL', () => {
      const key = 'zero-ttl'
      const data = { value: 'test' }

      cacheManager.set(key, data, 0)
      jest.advanceTimersByTime(1)

      expect(cacheManager.get(key)).toBeNull()
    })

    it('should handle very long TTL', () => {
      const key = 'long-ttl'
      const data = { value: 'test' }
      const ttl = 24 * 60 * 60 * 1000 // 24 hours

      cacheManager.set(key, data, ttl)
      jest.advanceTimersByTime(1000)

      expect(cacheManager.get(key)).toEqual(data)
    })
  })

  describe('invalidate', () => {
    it('should invalidate keys matching pattern', () => {
      cacheManager.set('user:1:profile', { id: 1 }, 60000)
      cacheManager.set('user:1:settings', { theme: 'dark' }, 60000)
      cacheManager.set('user:2:profile', { id: 2 }, 60000)

      cacheManager.invalidate('user:1')

      expect(cacheManager.get('user:1:profile')).toBeNull()
      expect(cacheManager.get('user:1:settings')).toBeNull()
      expect(cacheManager.get('user:2:profile')).toEqual({ id: 2 })
    })

    it('should invalidate all keys with pattern', () => {
      cacheManager.set('analytics:user:1', { views: 100 }, 60000)
      cacheManager.set('analytics:user:2', { views: 200 }, 60000)
      cacheManager.set('cache:other', { data: 'test' }, 60000)

      cacheManager.invalidate('analytics')

      expect(cacheManager.get('analytics:user:1')).toBeNull()
      expect(cacheManager.get('analytics:user:2')).toBeNull()
      expect(cacheManager.get('cache:other')).toEqual({ data: 'test' })
    })

    it('should handle invalidate with no matches', () => {
      cacheManager.set('key1', { value: 1 }, 60000)
      cacheManager.set('key2', { value: 2 }, 60000)

      cacheManager.invalidate('non-existent')

      expect(cacheManager.get('key1')).toEqual({ value: 1 })
      expect(cacheManager.get('key2')).toEqual({ value: 2 })
    })

    it('should be case-sensitive', () => {
      cacheManager.set('User:1:profile', { id: 1 }, 60000)
      cacheManager.set('user:1:settings', { theme: 'dark' }, 60000)

      cacheManager.invalidate('user:1')

      expect(cacheManager.get('User:1:profile')).toEqual({ id: 1 })
      expect(cacheManager.get('user:1:settings')).toBeNull()
    })
  })

  describe('clear', () => {
    it('should clear all cache entries', () => {
      cacheManager.set('key1', { value: 1 }, 60000)
      cacheManager.set('key2', { value: 2 }, 60000)
      cacheManager.set('key3', { value: 3 }, 60000)

      cacheManager.clear()

      expect(cacheManager.get('key1')).toBeNull()
      expect(cacheManager.get('key2')).toBeNull()
      expect(cacheManager.get('key3')).toBeNull()
    })
  })

  describe('CACHE_KEYS helpers', () => {
    it('should generate usage cache key', () => {
      const key = CACHE_KEYS.USAGE('user-123')
      expect(key).toBe('usage:user-123')
    })

    it('should generate analytics cache key', () => {
      const key = CACHE_KEYS.ANALYTICS('user-456')
      expect(key).toBe('analytics:user-456')
    })

    it('should generate task stats cache key', () => {
      const key = CACHE_KEYS.TASK_STATS('user-789')
      expect(key).toBe('task-stats:user-789')
    })
  })

  describe('CACHE_TTL constants', () => {
    it('should have correct TTL values', () => {
      expect(CACHE_TTL.USAGE).toBe(5 * 60 * 1000)
      expect(CACHE_TTL.ANALYTICS).toBe(10 * 60 * 1000)
      expect(CACHE_TTL.TASK_STATS).toBe(5 * 60 * 1000)
    })
  })

  describe('concurrent operations', () => {
    it('should handle multiple sets and gets', () => {
      for (let i = 0; i < 100; i++) {
        cacheManager.set(`key-${i}`, { index: i }, 60000)
      }

      for (let i = 0; i < 100; i++) {
        expect(cacheManager.get(`key-${i}`)).toEqual({ index: i })
      }
    })

    it('should handle overwriting existing keys', () => {
      const key = 'overwrite-key'

      cacheManager.set(key, { version: 1 }, 60000)
      expect(cacheManager.get(key)).toEqual({ version: 1 })

      cacheManager.set(key, { version: 2 }, 60000)
      expect(cacheManager.get(key)).toEqual({ version: 2 })
    })
  })
})
