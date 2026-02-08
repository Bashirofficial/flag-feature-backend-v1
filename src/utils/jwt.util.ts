import jwt from "jsonwebtoken";
import { ApiError } from "./ApiError";

const {
  ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET,
  JWT_ACCESS_EXPIRES,
  JWT_REFRESH_EXPIRES,
} = process.env;

if (!ACCESS_TOKEN_SECRET) throw new Error("ACCESS_TOKEN_SECRET missing");
if (!REFRESH_TOKEN_SECRET) throw new Error("REFRESH_TOKEN_SECRET missing");

if (!JWT_ACCESS_EXPIRES) throw new Error("JWT_ACCESS_EXPIRES missing");
if (!JWT_REFRESH_EXPIRES) throw new Error("JWT_REFRESH_EXPIRES missing");

export interface AccessPayload {
  userId: string;
}

export interface RefreshPayload {
  userId: string;
  tokenId: string; // matches RefreshToken.id in DB
}

export const generateAccessToken = (payload: AccessPayload) => {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRES,
  });
};

export const generateRefreshToken = (payload: RefreshPayload) => {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES,
  });
};

export const verifyAccessToken = (token: string): AccessPayload => {
  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);

    if (typeof decoded !== "object" || !decoded || !("userId" in decoded)) {
      throw new ApiError(401, "Invalid token payload");
    }

    return decoded as AccessPayload;
  } catch {
    throw new ApiError(401, "Invalid or expired access token");
  }
};