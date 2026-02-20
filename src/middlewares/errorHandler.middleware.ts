import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { Prisma } from "@prisma/client";
/**
 * Global error handling middleware
 * Must be placed after all routes
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error("Error:", err);

  // Handle ApiError
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      message: err.message,
      errors: err.errors,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violation
    if (err.code === "P2002") {
      return res.status(409).json({
        success: false,
        statusCode: 409,
        message: "A record with this value already exists",
        errors: [],
      });
    }

    // Record not found
    if (err.code === "P2025") {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: "Record not found",
        errors: [],
      });
    }

    // Foreign key constraint violation
    if (err.code === "P2003") {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Invalid reference to related record",
        errors: [],
      });
    }
  }

  // Handle Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Invalid data provided",
      errors: [],
    });
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      statusCode: 401,
      message: "Invalid token",
      errors: [],
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      statusCode: 401,
      message: "Token expired",
      errors: [],
    });
  }

  // Default error
  return res.status(500).json({
    success: false,
    statusCode: 500,
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
    errors: [],
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
