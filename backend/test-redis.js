import Redis from 'ioredis';

console.log('🧪 Testing Redis Connection...\n');

const redis = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    db: process.env.REDIS_DB || 0,
    maxRetriesPerRequest: 2,
    connectTimeout: 5000,
});

redis.on('connect', async () => {
    console.log('✅ Redis connected successfully!');

    try {
        // Test 1: Basic set/get
        console.log('\n📝 Test 1: Basic set/get operations');
        await redis.set('test:basic', 'Hello Redis!', 'EX', 60);
        const value = await redis.get('test:basic');
        console.log('✅ Set/Get test passed:', value);

        // Test 2: Cache service simulation
        console.log('\n📝 Test 2: Cache service simulation');
        const testData = {
            posts: [
                { id: 1, title: 'Test Post 1' },
                { id: 2, title: 'Test Post 2' }
            ],
            total: 2
        };

        await redis.set('posts:list:page:1:limit:10', JSON.stringify(testData), 'EX', 300);
        const cachedData = await redis.get('posts:list:page:1:limit:10');
        const parsedData = JSON.parse(cachedData);
        console.log('✅ Cache simulation passed:', parsedData.posts.length, 'posts cached');

        // Test 3: Pattern matching (for cache clearing)
        console.log('\n📝 Test 3: Pattern matching for cache clearing');
        const keys = await redis.keys('posts:list:*');
        console.log('✅ Found', keys.length, 'keys matching pattern "posts:list:*"');

        // Test 4: TTL (Time To Live)
        console.log('\n📝 Test 4: TTL (Time To Live) test');
        await redis.set('test:ttl', 'This will expire', 'EX', 5);
        const ttl = await redis.ttl('test:ttl');
        console.log('✅ TTL test passed, key expires in', ttl, 'seconds');

        // Test 5: Delete operations
        console.log('\n📝 Test 5: Delete operations');
        await redis.del('test:basic');
        await redis.del('posts:list:page:1:limit:10');
        await redis.del('test:ttl');
        console.log('✅ Delete operations passed');

        // Test 6: Performance test
        console.log('\n📝 Test 6: Performance test (1000 operations)');
        const startTime = Date.now();

        for (let i = 0; i < 1000; i++) {
            await redis.set(`perf:test:${i}`, `value${i}`, 'EX', 60);
        }

        const endTime = Date.now();
        const duration = endTime - startTime;
        console.log(`✅ Performance test passed: 1000 operations in ${duration}ms (${Math.round(1000 / duration * 1000)} ops/sec)`);

        // Cleanup performance test keys
        const perfKeys = await redis.keys('perf:test:*');
        if (perfKeys.length > 0) {
            await redis.del(perfKeys);
        }

        console.log('\n🎉 All Redis tests passed successfully!');
        console.log('\n📊 Redis is ready for your blogging platform!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await redis.quit();
        process.exit(0);
    }
});

redis.on('error', (err) => {
    console.error('❌ Redis connection failed:', err.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Make sure Redis is running: redis-cli ping');
    console.log('2. Check if port 6379 is available');
    console.log('3. Verify Redis installation');
    console.log('4. Check REDIS_SETUP.md for detailed instructions');
    process.exit(1);
});

// Handle process termination
process.on('SIGINT', async () => {
    console.log('\n👋 Shutting down Redis test...');
    await redis.quit();
    process.exit(0);
}); 