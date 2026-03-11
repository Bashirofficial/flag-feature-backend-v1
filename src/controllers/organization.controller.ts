import { Request, Response } from "express";
import prisma from "../db";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { AsyncHandler } from "../utils/AsyncHandler";

//--------- Controllers (C) ---------//

/* C1. Get organization details */
const getOrganization = AsyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      name: true,
      slug: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!organization) {
    throw new ApiError(404, "Organization not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, organization, "Organization retrieved successfully"),
    );
});

/* C2. Get organization statistics */
const getStats = AsyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;

  const [totalFlags, totalApiKeys, activeApiKeys] = await Promise.all([
    prisma.featureFlag.count({
      where: { organizationId },
    }),
    prisma.apiKey.count({
      where: { organizationId },
    }),
    prisma.apiKey.count({
      where: {
        organizationId,
        status: "ACTIVE",
      },
    }),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalFlags,
        totalApiKeys,
        activeApiKeys,
      },
      "Statistics retrieved successfully",
    ),
  );
});

// ============================================
//    Todo: Controller logic for update organization.
// ============================================

export { getOrganization, getStats };
