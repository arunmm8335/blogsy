import Redis from 'ioredis';

// Decide Redis connection
// 1. If REDIS_URL exists (cloud deployment), use it
// 2. Otherwise, fallback to local Redis (WSL / localhost)
const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL) // cloud Redis
  : new Redis({
      host: '127.0.0.1', // or WSL IP for dev
      port: 6379,
      maxRetriesPerRequest: 2,
      connectTimeout: 5000,
    });

// Event listeners
redis.on('connect', () => {
  console.log(
    process.env.REDIS_URL
      ? '✅ Connected to cloud Redis!'
      : '✅ Connected to local Redis!'
  );
});
redis.on('error', (err) => console.error('❌ Redis error:', err));

export const cacheService = {
  async get(key) {
    return await redis.get(key);
  },
  async set(key, value, ttlSeconds = 300) {
    await redis.set(key, value, 'EX', ttlSeconds);
  },
  async del(key) {
    await redis.del(key);
  },
  async clear(pattern) {
    const keys = await redis.keys(pattern);
    if (keys.length) await redis.del(keys);
  },
};

export default cacheService;
