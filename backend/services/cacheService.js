import Redis from 'ioredis';

const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, { tls: {}, family: 4 }) // Upstash requires TLS
  : new Redis({ host: '127.0.0.1', port: 6379, family: 4 }); // fallback local dev

redis.on('connect', () => {
  console.log(
    process.env.REDIS_URL
      ? '✅ Connected to Upstash Redis!'
      : '✅ Connected to local Redis!'
  );
});

redis.on('error', (err) => console.error('❌ Redis error:', err));

export const cacheService = {
  async get(key) { return redis.get(key); },
  async set(key, value, ttlSeconds = 300) { await redis.set(key, value, 'EX', ttlSeconds); },
  async del(key) { await redis.del(key); },
  async clear(pattern) {
    const keys = await redis.keys(pattern);
    if (keys.length) await redis.del(keys);
  },
};

export default cacheService;
