import { Request, Response } from "express";
import prisma from "../db";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { AsyncHandler } from "../utils/AsyncHandler";
import { generateApiKey } from "../utils/apiKey.util";
import { hashApiKey, getApiKeyPrefix } from "../utils/hash.util";

//--------- Controllers (C) ---------//

/* C1. Get all API keys */
const getApiKeys = AsyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;

  const apiKeys = await prisma.apiKey.findMany({
    where: { organizationId },
    include: {
      environment: {
        select: {
          name: true,
          key: true,
        },
      },
      createdBy: {
        select: {
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Format response
  const formattedKeys = apiKeys.map((key) => ({
    id: key.id,
    name: key.name,
    keyPrefix: key.keyPrefix,
    environment: key.environment.name,
    environmentKey: key.environment.key,
    status: key.status,
    lastUsedAt: key.lastUsedAt,
    usageCount: key.usageCount,
    createdAt: key.createdAt,
    createdBy: key.createdBy.email,
    revokedAt: key.revokedAt,
  }));

  return res
    .status(200)
    .json(
      new ApiResponse(200, formattedKeys, "API keys retrieved successfully"),
    );
});

// C2. Create an API key

const createApiKey = AsyncHandler(async (req: Request, res: Response) => {
  const { environmentId, name } = req.body;
  const organizationId = req.user!.organizationId;

  const environment = await prisma.environment.findFirst({
    where: {
      id: environmentId,
      organizationId,
    },
  });

  if (!environment) {
    throw new ApiError(404, "Environment not found");
  }

  const apiKey = generateApiKey(environment.key);
  const hashedKey = hashApiKey(apiKey);
  const keyPrefix = getApiKeyPrefix(apiKey);

  const apiKeyRecord = await prisma.$transaction(async (tx) => {
    const newKey = await tx.apiKey.create({
      data: {
        name,
        key: hashedKey,
        keyPrefix,
        organizationId,
        environmentId,
        createdById: req.user!.id,
      },
      include: {
        environment: {
          select: {
            name: true,
            key: true,
          },
        },
      },
    });

    await tx.auditLog.create({
      data: {
        action: "API_KEY_CREATED",
        resourceType: "api_key",
        resourceId: newKey.id,
        resourceName: name || keyPrefix,
        environmentKey: environment.key,
        organizationId,
        userId: req.user!.id,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      },
    });
    return newKey;
  });

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        id: apiKeyRecord.id,
        key: apiKey,
        keyPrefix: apiKeyRecord.keyPrefix,
        environment: apiKeyRecord.environment,
      },
      "API key has  been created successfully. Store the key securely - it will not be visible again.",
    ),
  );
});

// C3. Revoke API key
const revokeApiKey = AsyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const organizationId = req.user!.organizationId;

  const apiKey = await prisma.apiKey.findFirst({
    where: {
      id: id,
      organizationId,
    },
    include: {
      environment: {
        select: {
          key: true,
        },
      },
    },
  });

  if (!apiKey) {
    throw new ApiError(404, "API key not found");
  }

  if (apiKey.status === "REVOKED") {
    throw new ApiError(400, "API key is already revoked");
  }

  await prisma.$transaction(async (tx) => {
    await tx.apiKey.update({
      where: { id },
      data: {
        status: "REVOKED",
        revokedAt: new Date(),
      },
    });

    await tx.auditLog.create({
      data: {
        action: "API_KEY_REVOKED",
        resourceType: "api_key",
        resourceId: id,
        resourceName: apiKey.name || apiKey.keyPrefix,
        environmentKey: apiKey.environment.key,
        organizationId,
        userId: req.user!.id,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      },
    });
  });

  return res
    .status(201)
    .json(new ApiResponse(200, {}, "API key has been revoked successfully"));
});

const deleteApiKey = AsyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const organizationId = req.user!.organizationId;

  const apiKey = await prisma.apiKey.findFirst({
    where: {
      id: id,
      organizationId,
    },
  });

  if (!apiKey) {
    throw new ApiError(404, "API key not found");
  }

  await prisma.apiKey.delete({
    where: { id },
  });

  return res
    .status(201)
    .json(new ApiResponse(200, {}, "API key has been deleted successfully"));
});

// C4. Delete API key

export { getApiKeys, createApiKey, revokeApiKey, deleteApiKey };
