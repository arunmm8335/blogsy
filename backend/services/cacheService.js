import Redis from 'ioredis';

const redis = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    // password: process.env.REDIS_PASSWORD, // Uncomment if you set a password
    maxRetriesPerRequest: 2,
    connectTimeout: 5000,
});

redis.on('connect', () => console.log('Redis connected!'));
redis.on('error', (err) => console.error('Redis error:', err));

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
        // Clear all keys matching a pattern (use with caution)
        const keys = await redis.keys(pattern);
        if (keys.length) await redis.del(keys);
    },
};

export default cacheService; 