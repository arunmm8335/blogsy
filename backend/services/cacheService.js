import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export const cacheService = {
  async get(key) {
    return await redis.get(key);
  },
  async set(key, value, ttlSeconds = 300) {
    await redis.set(key, value, { ex: ttlSeconds });
  },
  async del(key) {
    return await redis.del(key);
  },
  async clear(pattern) {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  },
};

export default cacheService;
