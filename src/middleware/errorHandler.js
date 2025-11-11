/**
 * Error handling middleware
 * Provides centralized error handling for the API
 */

import { logger } from "../utils/logger.js";

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error handler middleware
 */
export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let isOperational =
    err.isOperational !== undefined ? err.isOperational : false;

  // Log error details
  if (statusCode >= 500) {
    logger.error(`Error in ${req.method} ${req.path}:`, err);
  } else {
    logger.warn(`Client error in ${req.method} ${req.path}: ${message}`, {
      statusCode,
    });
  }

  // Don't leak error details in production for non-operational errors
  if (!isOperational && process.env.NODE_ENV === "production") {
    message = "An unexpected error occurred";
  }

  res.status(statusCode).json({
    error: {
      message,
      statusCode,
      timestamp: new Date().toISOString(),
      path: req.path,
      ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
    },
  });
}

/**
 * 404 handler middleware
 */
export function notFoundHandler(req, res, next) {
  const error = new ApiError(
    `Route ${req.method} ${req.path} not found`,
    404,
    true
  );
  next(error);
}

/**
 * Async handler wrapper to catch promise rejections
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
