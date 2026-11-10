import { Pool } from 'pg';
import { S3Client } from '@aws-sdk/client-s3';
import Redis from 'ioredis';

// 1. PostgreSQL Database Pool Configuration
export const db = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'stories_db',
  max: 20,
  idleTimeoutMillis: 30000,
});

// Error handling for idle pool clients
db.on('error', (err) => {
  console.warn('[PostgreSQL Pool] Unexpected client error:', err.message);
});

// 2. AWS S3 Client Configuration
export const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

// 3. Redis Client Configuration
export const redis = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  lazyConnect: true,
  retryStrategy(times) {
    // Graceful backoff retry
    return Math.min(times * 100, 3000);
  },
});

redis.on('error', (err) => {
  console.warn('[Redis Cluster] Connection status:', err.message);
});
