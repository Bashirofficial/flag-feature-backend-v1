import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { AsyncHandler } from "../utils/AsyncHandler";

type Permission =
  | "flags:read"
  | "flags:write"
  | "flags:delete"
  | "api-keys:read"
  | "api-keys:write"
  | "api-keys:revoke"
  | "users:read"
  | "users:write"
  | "environments:read"
  | "environments:write"
  | "audit-logs:read"
  | "organization:read"
  | "organization:write";

// Define permissions for each role
const ROLE_PERMISSIONS: Record<"ADMIN" | "MEMBER", Permission[]> = {
  ADMIN: [
    "flags:read",
    "flags:write",
    "flags:delete",
    "api-keys:read",
    "api-keys:write",
    "api-keys:revoke",
    "users:read",
    "users:write",
    "environments:read",
    "environments:write",
    "audit-logs:read",
    "organization:read",
    "organization:write",
  ],
  MEMBER: [
    "flags:read",
    "environments:read",
    "audit-logs:read",
    "organization:read",
  ],
};

/**
 * Checks if user has required permission
 */
const hasPermission = (
  userRole: "ADMIN" | "MEMBER",
  permission: Permission,
): boolean => {
  return ROLE_PERMISSIONS[userRole].includes(permission);
};

/**
 * Middleware factory to check for specific permission
 * Usage: requirePermission('flags:write')
 */
export const requirePermission = (permission: Permission) => {
  return AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw new ApiError(401, "Authentication required");
      }

      if (!hasPermission(req.user.role, permission)) {
        throw new ApiError(
          403,
          `Insufficient permissions. Required: ${permission}`,
        );
      }

      next();
    },
  );
};

/**
 * Require ADMIN role
 * Usage: requireAdmin
 */
export const requireAdmin = AsyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    if (req.user.role !== "ADMIN") {
      throw new ApiError(403, "Admin access required");
    }

    next();
  },
);
