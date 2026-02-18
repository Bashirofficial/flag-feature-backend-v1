import { Request, Response } from "express";
import prisma from "../db";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { AsyncHandler } from "../utils/AsyncHandler";

//--------- Controllers (C) ---------//

/* C1. Get all flags for the environment */
const getAllFlags = AsyncHandler(async (req: Request, res: Response) => {
  const { organizationId, environmentId } = req.apiKey!;

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
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        flags: flagsMap,
        environment: req.apiKey!.environmentKey,
      },
      "Flags retrieved successfully",
    ),
  );
});

/* C2. Get a single flag by key value */
const getFlagByKey = AsyncHandler(async (req: Request, res: Response) => {
  const { key } = req.params;
  const { organizationId, environmentId } = req.apiKey!;

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

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        key: flag.key,
        value: flag.environmentValues[0].value,
        type: flag.type,
      },
      "Flag retireved successfully",
    ),
  );
});

/* C3. Get multiple specific flag */
const getBulkFlags = AsyncHandler(async (req: Request, res: Response) => {
  const { keys } = req.body;
  const { organizationId, environmentId } = req.apiKey!;

  if (!Array.isArray(keys) || keys.length === 0) {
    throw new ApiError(400, "Keys must be a non-empty array");
  }

  if (keys.length > 100) {
    throw new ApiError(400, "Maximum 100 flags can be fetched at once");
  }

  const flags = await prisma.featureFlag.findMany({
    where: {
      key: {
        in: keys,
      },
      organizationId,
      isActive: true,
    },
    include: {
      environmentValues: {
        where: {
          environmentId,
        },
      },
    },
  });

  const flagsMap: Record<string, any> = {};
  const missingKeys: string[] = [];

  keys.forEach((key) => {
    const flag = flags.find((f) => f.key === key);

    if (flag && flag.environmentValues.length > 0) {
      flagsMap[key] = flag.environmentValues[0].value;
    } else {
      missingKeys.push(key);
    }
  });
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        flags: flagsMap,
        missingKeys,
        environment: req.apiKey!.environmentKey,
      },
      "Flags retrieved successfully",
    ),
  );
});

/* C4. Check if a flag is enabled  */
const isFlagEnabled = AsyncHandler(async (req: Request, res: Response) => {
  const { key } = req.params;
  const { organizationId, environmentId } = req.apiKey!;

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

  const enabled = !!(
    flag &&
    flag.environmentValues.length > 0 &&
    flag.environmentValues[0].value === true
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        key,
        enabled,
      },
      "Flag status retireved successfully",
    ),
  );
});
