import { createClient } from 'redis';
import { config } from '../config';

class CacheService {
  private client: any = null;
  private isFallbackMode = false;
  private memoryCache = new Map<string, { value: string; expiry: number | null }>();

  constructor() {
    this.initializeRedis();
  }

  private async initializeRedis() {
    if (config.useMockCache) {
      console.log('💡 Force-Mock Cache enabled in configuration. Using in-memory cache.');
      this.isFallbackMode = true;
      return;
    }

    try {
      this.client = createClient({
        url: config.redisUrl
      });

      this.client.on('error', (err: any) => {
        // Suppress repeated stack traces and fallback silently
        if (!this.isFallbackMode) {
          console.warn('⚠️ Redis client error. Falling back to in-memory cache.');
          this.isFallbackMode = true;
        }
      });

      await this.client.connect();
      console.log('🚀 Successfully connected to Redis.');
    } catch (error) {
      console.warn('⚠️ Redis is offline or connection failed. Falling back to in-memory cache.');
      this.client = null;
      this.isFallbackMode = true;
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.isFallbackMode) {
      const entry = this.memoryCache.get(key);
      if (!entry) return null;
      if (entry.expiry && Date.now() > entry.expiry) {
        this.memoryCache.delete(key);
        return null;
      }
      return entry.value;
    }

    try {
      return await this.client.get(key);
    } catch (e) {
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.isFallbackMode) {
      const expiry = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
      this.memoryCache.set(key, { value, expiry });
      return;
    }

    try {
      if (ttlSeconds) {
        await this.client.set(key, value, { EX: ttlSeconds });
      } else {
        await this.client.set(key, value);
      }
    } catch (e) {
      // Ignore cache write errors during runtime
    }
  }

  async delete(key: string): Promise<void> {
    if (this.isFallbackMode) {
      this.memoryCache.delete(key);
      return;
    }

    try {
      await this.client.del(key);
    } catch (e) {
      // Ignore cache write errors
    }
  }

  async clear(): Promise<void> {
    if (this.isFallbackMode) {
      this.memoryCache.clear();
      return;
    }

    try {
      await this.client.flushAll();
    } catch (e) {
      // Ignore
    }
  }
}

export const cacheService = new CacheService();
export default cacheService;
