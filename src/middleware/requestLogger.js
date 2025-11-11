/**
 * Request logging middleware
 * Logs all incoming requests with timing information
 */

import { logger } from "../utils/logger.js";

export function requestLogger(req, res, next) {
  const startTime = Date.now();

  // Log when response is finished
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    logger.request(req, res, duration);
  });

  next();
}
