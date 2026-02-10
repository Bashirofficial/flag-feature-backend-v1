import { Request, Response } from "express";
import { comparePassword, hashPassword } from "../utils/hash.util";
import prisma from "../db";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { AsyncHandler } from "../utils/AsyncHandler";
import {
  generateAccessAndRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
} from "../services/auth.service";

//--------- Controllers (C) ---------//

// C1. Refresh Access Token using refreshToken
const refreshAccessToken = AsyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }

  const tokens = await rotateRefreshToken(refreshToken);
  return res
    .status(200)
    .json(new ApiResponse(200, tokens, "Tokens refreshed successfully"));
});

// C2. User Registration (Admin as default for now)
const register = AsyncHandler(async (req: Request, res: Response) => {
  const { firstName, lastName, email, password, organizationName } = req.body;

  if (
    [firstName, lastName, email, password, organizationName].some(
      (field) => field?.trim() === "",
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new ApiError(409, "User with this email already exists");
  }

  const existingOrg = await prisma.organization.findUnique({
    where: { name: organizationName },
  });
  if (existingOrg) {
    throw new ApiError(409, "Organization name is already taken");
  }

  const slug = organizationName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const hashedPassword = await hashPassword(password);

  const result = await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: {
        name: organizationName,
        slug,
      },
    });

    const environment = await Promise.all([
      tx.environment.create({
        data: {
          name: "Development",
          key: "dev",
          description: "Development environment",
          sortOrder: 1,
          organizationId: organization.id,
        },
      }),
      tx.environment.create({
        data: {
          name: "Staging",
          key: "staging",
          description: "Staging environment",
          sortOrder: 2,
          organizationId: organization.id,
        },
      }),
      tx.environment.create({
        data: {
          name: "Production",
          key: "prod",
          description: "Production environment",
          sortOrder: 3,
          organizationId: organization.id,
        },
      }),
    ]);

    const user = await tx.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: "ADMIN",
        organizationId: organization.id,
      },
    });

    return { organization, user, environment };
  });

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    result.user.id,
  );

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        user: {
          id: result.user.id,
          email: result.user.email,
          organizationId: result.user.organizationId,
          role: result.user.role,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      },
      "User along with organization has been registered Successfully",
    ),
  );
});

// C3. User Login
const login = AsyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  if (!user.isActive) {
    throw new ApiError(401, "Account is deactivated");
  }
  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user.id,
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      },
      "User logged in Successfully",
    ),
  );
});

// C4. User Logout
const logout = AsyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorized: User not authenticated.");
  }
  const { refreshToken } = req.body;

  await revokeRefreshToken(refreshToken);

  return res
    .status(200)
    .json(new ApiResponse(201, {}, "User logged out Successfully"));
});

/*
const verifyUser = AsyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;

  if (!user) {
    throw new ApiError(401, "Unauthorized: User not authenticated");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { user }, "User verified successfully"));
}); */

export { refreshAccessToken, register, login, logout };
