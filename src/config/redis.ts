/**
 * Development Phase - Redis configuration using ioredis with connection pooling and error handling.
 */
import Redis from "ioredis";

const redisClient = new Redis(process.env.REDIS_URL as string, {
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    console.warn(`Redis connection lost. Retrying in ${delay}ms...`);
    return delay;
  },
});

redisClient.on("error", (err) => {
  console.error("❌ Redis Client Error", err);
});

redisClient.on("connect", () => {
  console.log("✅ Redis connected");
});

export const connectRedis = async () => {
  await redisClient.ping();
};

export const closeRedis = async () => {
  await redisClient.quit();
  console.log("🛑 Redis disconnected");
};

export default redisClient;

/***
 * Production-ready Redis configuration using redis with connection pooling and error handling.

import { createClient, RedisClientType } from "redis";

const redisClient: RedisClientType = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on("error", (err) => {
  console.error("Redis Client Error", err);
});

redisClient.on("connect", () => {
  console.log("✅ Redis connected");
});

export const connectRedis = async () => {
  await redisClient.connect();
};

export const closeRedis = async () => {
  await redisClient.quit();
  console.log("🛑 Redis disconnected");
};

export default redisClient;

***/
