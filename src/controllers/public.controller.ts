import { Request, Response } from "express";
import prisma from "../db";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { AsyncHandler } from "../utils/AsyncHandler";
import CacheService from "../utils/cache.util";

const cache = CacheService.getInstance();

//--------- Controllers (C) ---------//

/* C1. Get all flags for the environment */
const getAllFlags = AsyncHandler(async (req: Request, res: Response) => {
  const { organizationId, environmentId, environmentKey } = req.apiKey!;
  const cacheKey = `flags:${organizationId}:${environmentId}`;

  const cachedFlags = await cache.get(cacheKey);
  if (cachedFlags) {
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          flags: JSON.parse(cachedFlags),
          environment: environmentKey,
        },
        "Flags retrieved successfully from cache",
      ),
    );
  }

  const flags = await prisma.featureFlag.findMany({
    where: { organizationId, isActive: true },
    include: {
      environmentValues: {
        where: {
          environmentId,
        },
      },
    },
  });
  const flagsMap: Record<string, any> = {};

  flags.forEach((flag) => {
    if (flag.environmentValues.length > 0) {
      flagsMap[flag.key] = flag.environmentValues[0]?.value ?? null;
    }
  });

  await cache.set(cacheKey, JSON.stringify(flagsMap), 300); // Cache for 5 minutes

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        flags: flagsMap,
        environment: environmentKey,
      },
      "Flags retrieved successfully",
    ),
  );
});

/* C2. Get a single flag by key value */
const getFlagByKey = AsyncHandler(async (req: Request, res: Response) => {
  const { key } = req.params as { key: string };
  const { organizationId, environmentId, environmentKey } = req.apiKey!;
  const cacheKey = `flag:${organizationId}:${environmentId}:${key}`;

  const cachedFlag = await cache.get(cacheKey);
  if (cachedFlag) {
    const parsed = JSON.parse(cachedFlag);
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          key: parsed.key,
          value: parsed.value,
          type: parsed.type,
        },
        "Flag retrieved successfully from cache",
      ),
    );
  }

  const flag = await prisma.featureFlag.findFirst({
    where: { key, organizationId, isActive: true },
    include: {
      environmentValues: {
        where: {
          environmentId,
        },
      },
    },
  });

  if (!flag) {
    throw new ApiError(404, `Flag ${key} not found`);
  }

  if (flag.environmentValues.length === 0) {
    throw new ApiError(404, `Flag ${key} has no value for this environment`);
  }

  const flagData = {
    key: flag.key,
    value: flag.environmentValues[0].value,
    type: flag.type,
  };

  await cache.set(cacheKey, JSON.stringify(flagData), 300);

  return res
    .status(200)
    .json(new ApiResponse(200, flagData, "Flag retrieved successfully"));
});

/* C3. Get multiple specific flag */
const getBulkFlags = AsyncHandler(async (req: Request, res: Response) => {
  const { keys } = req.body;
  const { organizationId, environmentId, environmentKey } = req.apiKey!;

  if (!Array.isArray(keys) || keys.length === 0) {
    throw new ApiError(400, "Keys must be a non-empty array");
  }

  if (keys.length > 100) {
    throw new ApiError(400, "Maximum 100 flags can be fetched at once");
  }

  const flagsMap: Record<string, any> = {};
  const missingKeys: string[] = [];

  const cacheResults = await Promise.all(
    keys.map((key) =>
      cache.get(`flag:${organizationId}:${environmentId}:${key}`),
    ),
  );

  keys.forEach((key, index) => {
    const cached = cacheResults[index];
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        flagsMap[key] = parsed.value;
      } catch {
        missingKeys.push(key); // Corrupted cache entry, treat as missing
      }
    } else {
      missingKeys.push(key);
    }
  });

  if (missingKeys.length > 0) {
    const flags = await prisma.featureFlag.findMany({
      where: {
        key: { in: missingKeys },
        organizationId,
        isActive: true,
      },
      include: {
        environmentValues: {
          where: { environmentId },
        },
      },
    });

    const flagMap = new Map(flags.map((f) => [f.key, f]));
    const cachePromises: Promise<any>[] = [];

    for (const key of missingKeys) {
      const flag = flagMap.get(key);

      if (flag && flag.environmentValues.length > 0) {
        const value = flag.environmentValues[0].value;
        flagsMap[key] = value;

        cachePromises.push(
          cache.set(
            `flag:${organizationId}:${environmentId}:${key}`,
            JSON.stringify({ key, value, type: flag.type }),
            300,
          ),
        );
      }
    }
    await Promise.all(cachePromises);
  }

  const finalMissingKeys = keys.filter((key) => !(key in flagsMap));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        flags: flagsMap,
        missingKeys: finalMissingKeys,
        environment: environmentKey,
      },
      "Flags retrieved successfully",
    ),
  );
});

/* C4. Check if a flag is enabled  */
const isFlagEnabled = AsyncHandler(async (req: Request, res: Response) => {
  const { key } = req.params as { key: string };
  const { organizationId, environmentId } = req.apiKey!;

  const cacheKey = `flag:${organizationId}:${environmentId}:${key}`;
  const cachedFlag = await cache.get(cacheKey);

  if (cachedFlag) {
    const parsed = JSON.parse(cachedFlag);
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          key,
          enabled: parsed.value === true,
        },
        "Flag status retrieved successfully from cache",
      ),
    );
  }

  const flag = await prisma.featureFlag.findFirst({
    where: {
      key,
      organizationId,
      isActive: true,
      type: "BOOLEAN",
    },
    include: {
      environmentValues: {
        where: { environmentId },
      },
    },
  });

  if (!flag) {
    throw new ApiError(404, `Flag ${key} not found`);
  }

  const flagData = {
    key: flag.key,
    value: flag.environmentValues[0].value,
    type: flag.type,
  };

  await cache.set(cacheKey, JSON.stringify(flagData), 300);

  const enabled = flagData.value === true;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        key,
        enabled,
      },
      "Flag status retrieved successfully",
    ),
  );
});

export { getAllFlags, getFlagByKey, getBulkFlags, isFlagEnabled };
