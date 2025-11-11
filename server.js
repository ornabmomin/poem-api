/**
 * Poetry API Server
 * A web scraping API for fetching poetry content with audio from Poetry Foundation
 */

import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { config } from "./src/config/index.js";
import { logger } from "./src/utils/logger.js";
import { browserPool } from "./src/utils/browserPool.js";
import {
  errorHandler,
  notFoundHandler,
} from "./src/middleware/errorHandler.js";
import { requestLogger } from "./src/middleware/requestLogger.js";
import poetryRoutes from "./src/routes/poetry.js";

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Health check endpoint
app.get("/health", (req, res) => {
  const poolStats = browserPool.getStats();
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    browserPool: poolStats,
    environment: config.server.nodeEnv,
  });
});

// API routes
app.use("/api", poetryRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown handler
async function gracefulShutdown(signal) {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  // Stop accepting new requests
  server.close(async () => {
    logger.info("HTTP server closed");

    // Shutdown browser pool
    await browserPool.shutdown();

    logger.info("Graceful shutdown complete");
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 30000);
}

// Start server
const server = app.listen(config.server.port, config.server.host, async () => {
  logger.info(
    `API running on http://${config.server.host}:${config.server.port}`
  );
  logger.info(`Environment: ${config.server.nodeEnv}`);

  // Initialize browser pool
  try {
    await browserPool.initialize();
    logger.info("Browser pool initialized successfully");
  } catch (error) {
    logger.error("Failed to initialize browser pool:", error);
  }
});

// Handle shutdown signals
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// Handle uncaught errors
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  gracefulShutdown("uncaughtException");
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", { promise, reason });
});
