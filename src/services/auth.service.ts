// src/services/auth.service.ts
import prisma from "../db";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.util";
import { ApiError } from "../utils/ApiError";

const getRefreshTokenExpiry = () =>
  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

const issueTokens = async (userId: string) => {
  const accessToken = generateAccessToken({ userId });

  const record = await prisma.refreshToken.create({
    data: {
      token: "temp",
      userId,
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  const refreshToken = generateRefreshToken({
    userId,
    tokenId: record.id,
  });

  await prisma.refreshToken.update({
    where: { id: record.id },
    data: { token: refreshToken },
  });

  return { accessToken, refreshToken };
};

export const generateAccessAndRefreshToken = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isActive: true },
  });

  if (!user || !user.isActive) {
    throw new ApiError(401, "User not authorized");
  }

  return issueTokens(user.id);
};

export const rotateRefreshToken = async (refreshToken: string) => {
  if (!refreshToken) {
    throw new ApiError(401, "Refresh token required");
  }

  // Decode refresh token payload
  const payload = verifyRefreshToken(refreshToken);

  // Find token record
  const tokenRecord = await prisma.refreshToken.findUnique({
    where: { id: payload.tokenId },
    include: { user: true },
  });

  if (!tokenRecord) {
    throw new ApiError(401, "Invalid refresh token");
  }

  // Expiry check
  if (tokenRecord.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { id: tokenRecord.id } });
    throw new ApiError(401, "Refresh token expired");
  }

  // Token reuse detection
  if (tokenRecord.token !== refreshToken) {
    throw new ApiError(401, "Refresh token reuse detected");
  }

  // User active?
  if (!tokenRecord.user.isActive) {
    throw new ApiError(401, "User deactivated");
  }

  // Delete old refresh token (rotation)
  await prisma.refreshToken.delete({
    where: { id: tokenRecord.id },
  });

  return issueTokens(tokenRecord.user.id);
};

export const revokeRefreshToken = async (refreshToken: string) => {
  const payload = verifyRefreshToken(refreshToken);

  await prisma.refreshToken.delete({
    where: { id: payload.tokenId },
  });
};
