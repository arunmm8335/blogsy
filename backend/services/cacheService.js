import Redis from 'ioredis';

const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, { family: 4 }) // cloud Redis
  : new Redis({ host: '127.0.0.1', port: 6379, family: 4 }); // local Redis for dev

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
