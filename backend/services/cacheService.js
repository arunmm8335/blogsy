import { Redis } from "@upstash/redis";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

let redis = null;
let cacheEnabled = false;

if (redisUrl && redisToken) {
  try {
    redis = new Redis({
      url: redisUrl,
      token: redisToken,
    });
    cacheEnabled = true;
  } catch (error) {
    console.warn("Redis cache disabled: invalid Upstash configuration.");
  }
} else {
  console.warn("Redis cache disabled: missing Upstash environment variables.");
}

export { redis };

export const cacheService = {
  async get(key) {
    if (!cacheEnabled) return null;

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
    if (!cacheEnabled) return;

    // Always stringify before saving
    const serialized = JSON.stringify(value);
    await redis.set(key, serialized, { ex: ttlSeconds });
  },

  async del(key) {
    if (!cacheEnabled) return 0;

    return await redis.del(key);
  },

  async clear(pattern) {
    if (!cacheEnabled) return;

    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  },
};

export default cacheService;
