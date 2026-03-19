import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { Prisma } from "@prisma/client";
import { logger } from "../config/logger";
/**
 * Global error handling middleware
 * Must be placed after all routes
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Logs the error with pino
  logger.error(
    {
      err,
      userId: (req as any).user?.id,
      orgName: (req as any).user?.orgName,
      method: req.method,
      url: req.originalUrl,
      body: req.body,
    },
    "Request Error",
  );

  let statusCode = 500;
  let message = "Internal server error";
  let errors: any[] = [];

  // Handle Known Errors
  if (err instanceof ApiError) {
    statusCode: err.statusCode;
    message: err.message;
    errors: err.errors;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      // Unique constraint violation
      statusCode: 409;
      message: "A record with this value already exists";
    }

    if (err.code === "P2025") {
      // Record not found
      statusCode: 404;
      message: "Record not found";
    }

    if (err.code === "P2003") {
      // Foreign key constraint violation
      statusCode: 400;
      message: "Invalid reference to related record";
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    // Handle Prisma validation errors
    statusCode: 400;
    message: "Invalid data provided";
  } else if (err.name === "JsonWebTokenError") {
    statusCode: 401;
    message: "Invalid token";
  } else if (err.name === "TokenExpiredError") {
    statusCode: 401;
    message: "Token expired";
  }

  // Final response
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message: process.env.NODE_ENV === "development" ? err.message : message,
    errors,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const error = new ApiError(404, `Route ${req.originalUrl} not found`);
  next(error);
};
