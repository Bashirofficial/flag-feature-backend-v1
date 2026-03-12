import { Request, Response } from "express";
import prisma from "../db";
import { ApiResponse } from "../utils/ApiResponse";
import { AsyncHandler } from "../utils/AsyncHandler";

//--------- Controllers (C) ---------//

/* C1. Gets audit logs with pagination and filtering */
const getAuditLogs = AsyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const { page = "1", action } = req.query as {
    page?: string;
    action?: string;
  };

  const pageNumber = parseInt(page, 10);
  const pageSize = 10;
  const skip = (pageNumber - 1) * pageSize;

  // Builds where clause
  const where: any = { organizationId };

  if (action) {
    where.action = action;
  }

  // Helps to get logs with pagination
  const [logs, totalItems] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);

  const totalPages = Math.ceil(totalItems / pageSize);

  // Formats response
  const formattedLogs = logs.map((log) => ({
    id: log.id,
    action: log.action,
    resourceType: log.resourceType,
    resourceId: log.resourceId,
    resourceName: log.resourceName,
    environmentKey: log.environmentKey,
    changes: log.changes,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    timestamp: log.createdAt,
    userId: log.userId,
    userEmail: log.user.email,
  }));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        logs: formattedLogs,
        pagination: {
          page: pageNumber,
          pageSize,
          totalPages,
          totalItems,
        },
      },
      "Audit logs retrieved successfully",
    ),
  );
});

export { getAuditLogs };
