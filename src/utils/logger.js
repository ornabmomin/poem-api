/**
 * Simple logger utility
 * Provides structured logging with different levels
 */

import { config } from "../config/index.js";

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const COLORS = {
  error: "\x1b[31m", // Red
  warn: "\x1b[33m", // Yellow
  info: "\x1b[36m", // Cyan
  debug: "\x1b[90m", // Gray
  reset: "\x1b[0m",
};

class Logger {
  constructor() {
    this.level = LOG_LEVELS[config.logging.level] || LOG_LEVELS.info;
  }

  /**
   * Format log message with timestamp and level
   */
  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const color = COLORS[level] || COLORS.reset;
    const reset = COLORS.reset;

    let output = `${color}[${timestamp}] [${level.toUpperCase()}]${reset} ${message}`;

    if (Object.keys(meta).length > 0) {
      output += ` ${JSON.stringify(meta)}`;
    }

    return output;
  }

  /**
   * Log error message
   */
  error(message, error = null) {
    if (this.level >= LOG_LEVELS.error) {
      const meta = {};
      if (error) {
        meta.error = error.message;
        meta.stack = error.stack;
      }
      console.error(this.formatMessage("error", message, meta));
    }
  }

  /**
   * Log warning message
   */
  warn(message, meta = {}) {
    if (this.level >= LOG_LEVELS.warn) {
      console.warn(this.formatMessage("warn", message, meta));
    }
  }

  /**
   * Log info message
   */
  info(message, meta = {}) {
    if (this.level >= LOG_LEVELS.info) {
      console.log(this.formatMessage("info", message, meta));
    }
  }

  /**
   * Log debug message
   */
  debug(message, meta = {}) {
    if (this.level >= LOG_LEVELS.debug) {
      console.log(this.formatMessage("debug", message, meta));
    }
  }

  /**
   * Log HTTP request
   */
  request(req, res, duration) {
    const meta = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    };

    const level = res.statusCode >= 400 ? "warn" : "info";
    this[level](`${req.method} ${req.path}`, meta);
  }
}

export const logger = new Logger();
