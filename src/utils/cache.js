/**
 * Simple in-memory cache implementation
 * Stores data with TTL (time-to-live) support
 */

import { config } from "../config/index.js";
import { logger } from "./logger.js";

class Cache {
  constructor() {
    this.store = new Map();
    this.enabled = config.cache.enabled;
    this.defaultTTL = config.cache.ttl;
  }

  /**
   * Get value from cache
   */
  get(key) {
    if (!this.enabled) return null;

    const item = this.store.get(key);

    if (!item) {
      return null;
    }

    // Check if item has expired
    if (Date.now() > item.expiresAt) {
      this.delete(key);
      logger.debug(`Cache expired for key: ${key}`);
      return null;
    }

    logger.debug(`Cache hit for key: ${key}`);
    return item.value;
  }

  /**
   * Set value in cache with optional TTL
   */
  set(key, value, ttl = this.defaultTTL) {
    if (!this.enabled) return;

    const expiresAt = Date.now() + ttl;

    this.store.set(key, {
      value,
      expiresAt,
      createdAt: Date.now(),
    });

    logger.debug(`Cache set for key: ${key}, TTL: ${ttl}ms`);
  }

  /**
   * Delete value from cache
   */
  delete(key) {
    const deleted = this.store.delete(key);
    if (deleted) {
      logger.debug(`Cache deleted for key: ${key}`);
    }
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  clear() {
    const size = this.store.size;
    this.store.clear();
    logger.info(`Cache cleared: ${size} entries removed`);
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    let removed = 0;

    for (const [key, item] of this.store.entries()) {
      if (now > item.expiresAt) {
        this.store.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      logger.debug(`Cache cleanup: ${removed} expired entries removed`);
    }

    return removed;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let expired = 0;
    let valid = 0;

    for (const item of this.store.values()) {
      if (now > item.expiresAt) {
        expired++;
      } else {
        valid++;
      }
    }

    return {
      total: this.store.size,
      valid,
      expired,
      enabled: this.enabled,
    };
  }

  /**
   * Check if cache has a key
   */
  has(key) {
    if (!this.enabled) return false;

    const item = this.store.get(key);
    if (!item) return false;

    // Check if expired
    if (Date.now() > item.expiresAt) {
      this.delete(key);
      return false;
    }

    return true;
  }
}

// Export singleton instance
export const cache = new Cache();

// Run cleanup every 5 minutes
setInterval(() => {
  cache.cleanup();
}, 300000);
