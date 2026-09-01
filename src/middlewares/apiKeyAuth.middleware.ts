import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { AsyncHandler } from "../utils/AsyncHandler";
import { hashApiKey } from "../utils/hash.util";
import { isValidApiKeyFormat } from "../utils/apiKey.util";
import prisma from "../db";
import CacheService from "../utils/cache.util";

const cache = CacheService.getInstance();

interface CachedApiKey {
  id: string;
  organizationId: string;
  environmentId: string;
  environmentKey: string;
  status: string;
  revokedAt: Date | null;
}

export const authenticateApiKey = AsyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    console.time("API Key Middleware"); //Debugging purpose

    const apiKeyHeader =
      req.headers["x-api-key"] || req.headers["authorization"];

    if (!apiKeyHeader) {
      throw new ApiError(401, "API key is required");
    }

    // Handles both formats: "Bearer sk_..." or just "sk_..."
    let apiKey = typeof apiKeyHeader === "string" ? apiKeyHeader : "";

    if (apiKey.startsWith("Bearer ")) {
      apiKey = apiKey.substring(7);
    }

    if (!apiKey) {
      throw new ApiError(401, "API key is required");
    }

    if (!isValidApiKeyFormat(apiKey)) {
      throw new ApiError(401, "Invalid API key format");
    }

    // Hashes the key for database lookup
    console.time("Hash API Key"); //Debugging purpose
    const hashedKey = hashApiKey(apiKey);
    console.timeEnd("Hash API Key"); //Debugging purpose

    // Stored the hashed key in cache key variable for cache lookup immediately after hashing the key
    const cacheKey = `apikey:${hashedKey}`;

    // Fetching api key from cache
    console.time("Redis API Key GET");
    const cachedApiKey = await cache.get<CachedApiKey>(cacheKey);
    console.timeEnd("Redis API Key GET");

    if (cachedApiKey) {
      // Checks if key is revoked or not
      if (cachedApiKey.status !== "ACTIVE" || cachedApiKey.revokedAt) {
        console.timeEnd("API Key Middleware"); //Debugging purpose
        throw new ApiError(401, "API key has been revoked");
      }

      // Attaching API key info to request
      req.apiKey = {
        id: cachedApiKey.id,
        organizationId: cachedApiKey.organizationId,
        environmentId: cachedApiKey.environmentId,
        environmentKey: cachedApiKey.environmentKey,
      };

      console.timeEnd("API Key Middleware"); //Debugging purpose
      return next();
    }

    console.time("Prisma findUnique"); //Debugging purpose
    const apiKeyRecord = await prisma.apiKey.findUnique({
      where: { key: hashedKey },
      include: {
        environment: true,
      },
    });
    console.timeEnd("Prisma findUnique"); //Debugging purpose

    if (!apiKeyRecord) {
      console.timeEnd("API Key Middleware"); //Debugging purpose
      throw new ApiError(401, "Invalid API key");
    }

    //Checks if key is revoked or not
    if (apiKeyRecord.status !== "ACTIVE" || apiKeyRecord.revokedAt) {
      console.timeEnd("API Key Middleware"); //Debugging purpose
      throw new ApiError(401, "API key has been revoked");
    }

    console.time("Prisma update"); //Debugging purpose
    // Updates usage tracking (asynchronously executed and doesn't waits) -- For small user this method is okay but as users go I need to change the method to batch update
    prisma.apiKey
      .update({
        where: { id: apiKeyRecord.id },
        data: {
          lastUsedAt: new Date(),
          usageCount: { increment: 1 },
        },
      })
      .catch((err) => {
        console.error("Failed to update API key usage: ", err); // Logs error only but doesn't fail request
      })
      .finally(() => {
        console.timeEnd("Prisma update");
      }); //From .finally() it is or debugging purpose

    console.time("Redis API Key SET");
    // Set the cache with API key details as cache miss occurs - and auth shouldn't wait for redis to set the cache
    cache
      .set(
        cacheKey,
        {
          id: apiKeyRecord.id,
          organizationId: apiKeyRecord.organizationId,
          environmentId: apiKeyRecord.environment.id,
          environmentKey: apiKeyRecord.environment.key,
          status: apiKeyRecord.status,
          revokedAt: apiKeyRecord.revokedAt,
        },
        300,
      )
      .catch(console.error);
    console.timeEnd("Redis API Key SET");

    // Attaching API key info to request
    req.apiKey = {
      id: apiKeyRecord.id,
      organizationId: apiKeyRecord.organizationId,
      environmentId: apiKeyRecord.environment.id,
      environmentKey: apiKeyRecord.environment.key,
    };

    console.timeEnd("API Key Middleware"); //Debugging purpose
    next();
  },
);
