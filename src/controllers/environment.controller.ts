import { Request, Response } from "express";
import prisma from "../db";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { AsyncHandler } from "../utils/AsyncHandler";
import {
  CreateEnvironmentInput,
  UpdateEnvironmentInput,
} from "../validators/environment.validator";

//--------- Controllers (C) ---------//

/* C1. Gets all environments for organization */
const getAllEnvironments = AsyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;

  const environments = await prisma.environment.findMany({
    where: { organizationId },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      key: true,
      description: true,
      sortOrder: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          apiKeys: true,
          flagValues: true,
        },
      },
    },
  });

  // Formats response
  const formattedEnvironments = environments.map((env) => ({
    id: env.id,
    name: env.name,
    key: env.key,
    description: env.description,
    sortOrder: env.sortOrder,
    apiKeyCount: env._count.apiKeys,
    flagCount: env._count.flagValues,
    createdAt: env.createdAt,
    updatedAt: env.updatedAt,
  }));

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        formattedEnvironments,
        "Environments retrieved successfully",
      ),
    );
});

/* C2. Gets single environment by ID */
const getEnvironment = AsyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const organizationId = req.user!.organizationId;

  const environment = await prisma.environment.findFirst({
    where: {
      id,
      organizationId,
    },
    include: {
      _count: {
        select: {
          apiKeys: true,
          flagValues: true,
        },
      },
    },
  });

  if (!environment) {
    throw new ApiError(404, "Environment not found");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        id: environment.id,
        name: environment.name,
        key: environment.key,
        description: environment.description,
        sortOrder: environment.sortOrder,
        apiKeyCount: environment._count.apiKeys,
        flagCount: environment._count.flagValues,
        createdAt: environment.createdAt,
        updatedAt: environment.updatedAt,
      },
      "Environment retrieved successfully",
    ),
  );
});

/* C3. Creates new environment */
const createEnvironment = AsyncHandler(
  async (req: Request<{}, {}, CreateEnvironmentInput>, res: Response) => {
    const { name, key, description } = req.body;
    const organizationId = req.user!.organizationId;

    // Checks if key already exists
    const existingEnv = await prisma.environment.findFirst({
      where: {
        key,
        organizationId,
      },
    });

    if (existingEnv) {
      throw new ApiError(
        409,
        "Environment with this key already exists in your organization",
      );
    }

    // Creates environment and initialize flag values
    const environment = await prisma.$transaction(async (tx) => {
      const lastEnv = await tx.environment.findFirst({
        where: { organizationId },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });

      const nextSortOrder = (lastEnv?.sortOrder ?? 0) + 1;

      // Creates environment
      const newEnv = await tx.environment.create({
        data: {
          name,
          key,
          description,
          sortOrder: nextSortOrder,
          organizationId,
        },
      });

      // Gets all existing flags for this organization
      const flags = await tx.featureFlag.findMany({
        where: { organizationId },
      });
      const TYPE_DEFAULTS = {
        BOOLEAN: false,
        NUMBER: 0,
        STRING: "",
        JSON: {},
      };
      // Creates default values for all existing flags
      if (flags.length > 0) {
        await tx.flagEnvironmentValue.createMany({
          data: flags.map((flag) => ({
            flagId: flag.id,
            environmentId: newEnv.id,
            value: TYPE_DEFAULTS[flag.type],
          })),
          skipDuplicates: true,
        });
      }

      // Log audit
      await tx.auditLog.create({
        data: {
          action: "ENVIRONMENT_CREATED",
          resourceType: "environment",
          resourceId: newEnv.id,
          resourceName: name,
          organizationId,
          userId: req.user!.id,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        },
      });

      return newEnv;
    });

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { id: environment.id },
          "Environment created successfully",
        ),
      );
  },
);

/* C4. Updates environment */
const updateEnvironment = AsyncHandler(
  async (req: Request<{}, {}, UpdateEnvironmentInput>, res: Response) => {
    const { id } = req.params as { id: string };
    const { name, description } = req.body;
    const organizationId = req.user!.organizationId;

    // Checks if environment exists
    const existingEnv = await prisma.environment.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!existingEnv) {
      throw new ApiError(404, "Environment not found");
    }

    // Updates environment
    const updatedEnvironment = await prisma.$transaction(async (tx) => {
      const updated = await tx.environment.update({
        where: { id },
        data: {
          name,
          description,
        },
      });

      // Log audit
      await tx.auditLog.create({
        data: {
          action: "ENVIRONMENT_UPDATED",
          resourceType: "environment",
          resourceId: id,
          resourceName: existingEnv.name,
          changes: {
            before: {
              name: existingEnv.name,
              description: existingEnv.description,
            },
            after: { name, description },
          },
          organizationId,
          userId: req.user!.id,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        },
      });

      return updated;
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updatedEnvironment,
          "Environment updated successfully",
        ),
      );
  },
);

/* C5. Deletes environment */
const deleteEnvironment = AsyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const organizationId = req.user!.organizationId;

  // Checks if environment exists
  const environment = await prisma.environment.findFirst({
    where: {
      id,
      organizationId,
    },
    include: {
      _count: {
        select: {
          apiKeys: true,
        },
      },
    },
  });

  if (!environment) {
    throw new ApiError(404, "Environment not found");
  }

  // Checks if environment has active API keys
  const activeApiKeys = await prisma.apiKey.count({
    where: {
      environmentId: id,
      status: "ACTIVE",
    },
  });

  if (activeApiKeys > 0) {
    throw new ApiError(
      400,
      `Cannot delete environment. It has ${activeApiKeys} active API key(s). Please revoke all API keys first.`,
    );
  }

  // Deletes environment (cascade will delete flag values and revoked API keys)
  await prisma.$transaction(async (tx) => {
    await tx.environment.delete({
      where: { id },
    });

    // Log audit
    await tx.auditLog.create({
      data: {
        action: "ENVIRONMENT_DELETED",
        resourceType: "environment",
        resourceId: id,
        resourceName: environment.name,
        organizationId,
        userId: req.user!.id,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      },
    });
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Environment deleted successfully"));
});

export {
  getAllEnvironments,
  getEnvironment,
  createEnvironment,
  updateEnvironment,
  deleteEnvironment,
};
