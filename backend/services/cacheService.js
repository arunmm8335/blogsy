import Redis from 'ioredis';

// 🔒 Force local Redis (ignore REDIS_URL for now)
const redis = new Redis({
  host: '127.0.0.1',   // or 'localhost'
  port: 6379,
  maxRetriesPerRequest: 2,
  connectTimeout: 5000,
});

redis.on('connect', () => console.log('✅ Redis connected to local instance!'));
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
