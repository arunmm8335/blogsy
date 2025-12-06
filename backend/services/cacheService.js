import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export const cacheService = {
  async get(key) {
    const result = await redis.get(key);

    if (!result) return null;

    // If the value is already an object (Upstash sometimes returns parsed JSON)
    if (typeof result !== "string") {
      return result;
    }

    try {
      return JSON.parse(result);
    } catch {
      return result; // fallback if it's just a string
    }
  },

  async set(key, value, ttlSeconds = 300) {
    // Always stringify before saving
    const serialized = JSON.stringify(value);
    await redis.set(key, serialized, { ex: ttlSeconds });
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
