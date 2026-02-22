import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { AsyncHandler } from "../utils/AsyncHandler";
import { hashApiKey } from "../utils/hash.util";
import { isValidApiKeyFormat } from "../utils/apiKey.util";
import prisma from "../db";

export const authenticateApiKey = AsyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
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
    const hashedKey = hashApiKey(apiKey);
    const apiKeyRecord = await prisma.apiKey.findUnique({
      where: { key: hashedKey },
      include: {
        environment: true,
      },
    });

    if (!apiKeyRecord) {
      throw new ApiError(401, "Invalid API key");
    }

    //Checks if key is revoked or not
    if (apiKeyRecord.status !== "ACTIVE" || apiKeyRecord.revokedAt) {
      throw new ApiError(401, "API key has been revoked");
    }

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
      });

    // Attaching API key info to request
    req.apiKey = {
      id: apiKeyRecord.id,
      organizationId: apiKeyRecord.organizationId,
      environmentId: apiKeyRecord.environmentId,
      environmentKey: apiKeyRecord.environment.key,
    };

    next();
  },
);
