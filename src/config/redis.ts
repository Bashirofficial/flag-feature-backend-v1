/**
 * Development Phase - Redis configuration using ioredis with connection pooling and error handling.
 */
import Redis from "ioredis";

const redisClient = new Redis(process.env.REDIS_URL as string, {
  connectTimeout: 10000,
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

// Diagnostic check to see your actual internal network speed
redisClient.on("ready", async () => {
  console.log("🚀 Redis Client is fully ready for commands.");
  const start = performance.now();
  await redisClient.ping();
  const end = performance.now();
  console.log(`⏱️ Baseline Socket Latency: ${(end - start).toFixed(2)}ms`);
});

redisClient.on("end", () => {
  console.warn("Redis connection closed");
});

redisClient.on("close", () => {
  console.warn("Redis socket closed");
});

export const connectRedis = async () => {
  //await redisClient.ping();

  if (redisClient.status === "ready") {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const onReady = () => {
      cleanup();
      resolve();
    };

    const onError = (err: Error) => {
      cleanup();
      reject(err);
    };

    const cleanup = () => {
      redisClient.off("ready", onReady);
      redisClient.off("error", onError);
    };

    redisClient.once("ready", onReady);
    redisClient.once("error", onError);
  });

  console.log("✅ Redis connection established.");
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
