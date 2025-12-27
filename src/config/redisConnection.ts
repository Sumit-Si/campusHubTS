import { Redis } from "ioredis";
import config from "./config";

console.log("Redis connection config - Host:", config.REDIS_HOST, "Port:", config.REDIS_PORT);

const redisConnection = new Redis({
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
    maxRetriesPerRequest: null,
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
            return true;
        }
        return false;
    },
});

redisConnection.on('connect', () => {
    console.log('✅ Redis connected successfully');
});

redisConnection.on('error', (err) => {
    console.error('❌ Redis connection error:', err.message);
    if (err.message.includes('ENOTFOUND')) {
        console.error(`⚠️  Cannot resolve hostname: ${config.REDIS_HOST}`);
        console.error('💡 Solution: If running outside Docker, set REDIS_HOST=localhost in your .env file');
        console.error('💡 If running inside Docker, ensure your app container is on the same network as Redis');
    }
});

redisConnection.on('ready', () => {
    console.log('✅ Redis is ready to accept commands');
});

export { redisConnection };