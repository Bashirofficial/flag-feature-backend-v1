import redisClient from "../config/redis";

export class CacheService {
  private static instance: CacheService;
  private client = redisClient;

  private constructor() {}

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  }

  async set(
    key: string,
    value: string,
    ttlSeconds: number = 300,
  ): Promise<void> {
    try {
      // setex is being used for ioredis and for redis  setEx is being used
      await this.client.setex(key, ttlSeconds, value);
    } catch (error) {
      console.error("Cache set error:", error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      console.error("Cache del error:", error);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      console.error("Cache delPattern error:", error);
    }
  }
}

export default CacheService;
