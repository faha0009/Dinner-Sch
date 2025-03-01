import { Redis } from 'ioredis';

// Create Redis client with your Redis URL
// For local development, you can use a local Redis instance
// For production, you'll need to use a Redis service like Upstash with Vercel
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export default redis;