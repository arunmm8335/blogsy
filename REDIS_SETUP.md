# Redis Integration Setup Guide

## Overview

This guide will help you set up Redis caching for your Blogsy blogging platform. Redis will significantly improve performance by caching frequently accessed data.

## Prerequisites

- Node.js and npm installed
- Basic knowledge of terminal/command line
- Your blogging platform backend running

## Installation by Operating System

### Windows

#### Option 1: Using WSL2 (Recommended)
```bash
# Open WSL2 terminal
wsl

# Update package list
sudo apt update

# Install Redis
sudo apt install redis-server

# Start Redis service
sudo service redis-server start

# Enable Redis to start on boot
sudo systemctl enable redis-server

# Test Redis
redis-cli ping
# Should return: PONG
```

#### Option 2: Using Docker
```bash
# Pull and run Redis container
docker run -d -p 6379:6379 --name redis-server redis:alpine

# Test Redis
docker exec -it redis-server redis-cli ping
# Should return: PONG
```

#### Option 3: Windows Native (Unofficial)
1. Download Redis for Windows from: https://github.com/microsoftarchive/redis/releases
2. Extract and run `redis-server.exe`
3. Test with `redis-cli.exe ping`

### macOS

#### Using Homebrew
```bash
# Install Redis
brew install redis

# Start Redis service
brew services start redis

# Test Redis
redis-cli ping
# Should return: PONG
```

#### Using Docker
```bash
# Pull and run Redis container
docker run -d -p 6379:6379 --name redis-server redis:alpine

# Test Redis
docker exec -it redis-server redis-cli ping
# Should return: PONG
```

### Linux (Ubuntu/Debian)

```bash
# Update package list
sudo apt update

# Install Redis
sudo apt install redis-server

# Start Redis service
sudo systemctl start redis-server

# Enable Redis to start on boot
sudo systemctl enable redis-server

# Test Redis
redis-cli ping
# Should return: PONG
```

## Configuration

### 1. Environment Variables

Add these to your `backend/.env` file:

```env
# Redis Configuration
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=  # Leave empty for local development
REDIS_DB=0

# Optional: Redis URL (alternative to individual settings)
# REDIS_URL=redis://127.0.0.1:6379
```

### 2. Redis Configuration File (Optional)

For production or advanced configuration, edit `/etc/redis/redis.conf`:

```conf
# Basic settings
bind 127.0.0.1
port 6379
timeout 300
tcp-keepalive 60

# Memory settings
maxmemory 256mb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000

# Security (for production)
# requirepass your_strong_password
```

## Testing Redis Connection

### 1. Test Redis CLI
```bash
# Connect to Redis
redis-cli

# Test basic operations
127.0.0.1:6379> ping
PONG

127.0.0.1:6379> set test "Hello Redis"
OK

127.0.0.1:6379> get test
"Hello Redis"

127.0.0.1:6379> del test
(integer) 1

127.0.0.1:6379> exit
```

### 2. Test from Node.js
```bash
# Navigate to backend directory
cd backend

# Create a test file
echo "
import Redis from 'ioredis';

const redis = new Redis({
  host: '127.0.0.1',
  port: 6379
});

redis.on('connect', () => {
  console.log('✅ Redis connected successfully!');
  
  // Test operations
  redis.set('test', 'Hello from Node.js!', 'EX', 60)
    .then(() => redis.get('test'))
    .then(value => {
      console.log('✅ Test value:', value);
      redis.del('test');
      redis.quit();
    });
});

redis.on('error', (err) => {
  console.error('❌ Redis error:', err);
  process.exit(1);
});
" > test-redis.js

# Run the test
node test-redis.js
```

## Integration with Your Application

### 1. Verify Cache Service

Your `backend/services/cacheService.js` should look like this:

```javascript
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  db: process.env.REDIS_DB || 0,
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
    const keys = await redis.keys(pattern);
    if (keys.length) await redis.del(keys);
  },
};

export default cacheService;
```

### 2. Test Your Application

1. **Start your backend:**
   ```bash
   cd backend
   npm start
   ```

2. **Check for Redis connection message:**
   ```
   Redis connected!
   Server is running on port 5000
   MongoDB connected successfully.
   ```

3. **Test caching:**
   - Visit your homepage
   - Check backend logs for "Cache miss" on first visit
   - Refresh the page
   - Check backend logs for "Cache hit" on second visit

## Monitoring and Management

### 1. Redis CLI Commands

```bash
# Connect to Redis
redis-cli

# Monitor all Redis commands in real-time
127.0.0.1:6379> monitor

# Get Redis info
127.0.0.1:6379> info

# Get memory usage
127.0.0.1:6379> info memory

# List all keys
127.0.0.1:6379> keys *

# Get key count
127.0.0.1:6379> dbsize

# Clear all data
127.0.0.1:6379> flushall

# Exit
127.0.0.1:6379> exit
```

### 2. Redis Desktop Manager (Optional)

For GUI management, you can use:
- **RedisInsight** (Free, official): https://redis.com/redis-enterprise/redis-insight/
- **Redis Desktop Manager**: https://rdm.dev/

## Troubleshooting

### Common Issues

#### 1. Connection Refused
```
Redis error: Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Solution:**
- Check if Redis is running: `redis-cli ping`
- Start Redis service
- Check if port 6379 is available: `netstat -an | grep 6379`

#### 2. Redis Not Starting
```
Failed to start redis-server.service: Unit redis-server.service not found.
```

**Solution:**
- Install Redis first: `sudo apt install redis-server`
- Check installation: `which redis-server`

#### 3. Permission Denied
```
(error) NOAUTH Authentication required.
```

**Solution:**
- Check if password is set in redis.conf
- Use: `redis-cli -a your_password`
- Or remove password requirement for development

#### 4. Memory Issues
```
OOM command not allowed when used memory > 'maxmemory'
```

**Solution:**
- Increase maxmemory in redis.conf
- Or clear some keys: `redis-cli flushall`

### Performance Optimization

#### 1. Memory Settings
```conf
# In redis.conf
maxmemory 512mb
maxmemory-policy allkeys-lru
```

#### 2. Persistence Settings
```conf
# For development (faster)
save ""
appendonly no

# For production (safer)
save 900 1
save 300 10
save 60 10000
appendonly yes
```

#### 3. Network Settings
```conf
# For local development
bind 127.0.0.1
protected-mode no

# For production
bind 0.0.0.0
protected-mode yes
```

## Production Considerations

### 1. Security
- Set a strong password
- Use SSL/TLS
- Bind to specific IP addresses
- Disable dangerous commands

### 2. Monitoring
- Set up Redis monitoring
- Monitor memory usage
- Set up alerts for high memory usage
- Log Redis operations

### 3. Backup
- Enable RDB persistence
- Set up automated backups
- Test backup restoration

### 4. Scaling
- Consider Redis Cluster for large datasets
- Use Redis Sentinel for high availability
- Implement read replicas

## Quick Commands Reference

```bash
# Start Redis
sudo systemctl start redis-server  # Linux
brew services start redis          # macOS
redis-server                       # Windows

# Stop Redis
sudo systemctl stop redis-server   # Linux
brew services stop redis           # macOS
redis-cli shutdown                 # Windows

# Check Redis status
sudo systemctl status redis-server # Linux
brew services list | grep redis    # macOS

# Test Redis
redis-cli ping

# Monitor Redis
redis-cli monitor

# Clear all data
redis-cli flushall

# Get Redis info
redis-cli info
```

## Next Steps

After setting up Redis:

1. **Test your application** - Verify caching is working
2. **Monitor performance** - Check cache hit rates
3. **Optimize TTL values** - Adjust cache expiration times
4. **Add monitoring** - Set up Redis monitoring tools
5. **Plan for production** - Consider Redis Cluster or Redis Cloud

## Support

If you encounter issues:

1. Check this troubleshooting guide
2. Check Redis logs: `sudo journalctl -u redis-server`
3. Verify Redis is running: `redis-cli ping`
4. Check your application logs for Redis errors
5. Consult Redis documentation: https://redis.io/documentation 