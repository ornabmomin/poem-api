/**
 * Browser Pool Manager
 * Manages a pool of Puppeteer browser instances for efficient resource usage
 */

import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { config } from "../config/index.js";
import { logger } from "./logger.js";

class BrowserPool {
  constructor() {
    this.browsers = [];
    this.available = [];
    this.inUse = new Set();
    this.minBrowsers = config.browserPool.min;
    this.maxBrowsers = config.browserPool.max;
    this.idleTimeout = config.browserPool.idleTimeout;
    this.initialized = false;
  }

  /**
   * Initialize the browser pool with minimum browsers
   */
  async initialize() {
    if (this.initialized) return;

    logger.info("Initializing browser pool...");

    for (let i = 0; i < this.minBrowsers; i++) {
      try {
        const browser = await this.createBrowser();
        this.browsers.push(browser);
        this.available.push(browser);
      } catch (error) {
        logger.error(`Failed to create browser ${i + 1}:`, error);
      }
    }

    this.initialized = true;
    logger.info(
      `Browser pool initialized with ${this.browsers.length} browsers`
    );
  }

  /**
   * Create a new browser instance
   */
  async createBrowser() {
    const executablePath =
      process.env.PUPPETEER_EXECUTABLE_PATH ||
      config.puppeteer.executablePath ||
      (await chromium.executablePath());

    const launchOptions = {
      headless: "new",
      args: [
        ...config.puppeteer.args,
        ...(process.env.PUPPETEER_EXECUTABLE_PATH ? [] : chromium.args),
      ],
      executablePath,
      defaultViewport: chromium.defaultViewport,
      ignoreHTTPSErrors: true,
    };
    const browser = await puppeteer.launch(launchOptions);
    browser._createdAt = Date.now();
    browser._lastUsed = Date.now();

    // Handle browser disconnection
    browser.on("disconnected", () => {
      this.removeBrowser(browser);
    });

    return browser;
  }

  /**
   * Acquire a browser from the pool
   */
  async acquire() {
    if (!this.initialized) {
      await this.initialize();
    }

    // Try to get an available browser
    let browser = this.available.shift();

    // If no available browsers and we haven't reached max, create a new one
    if (!browser && this.browsers.length < this.maxBrowsers) {
      try {
        browser = await this.createBrowser();
        this.browsers.push(browser);
        logger.info(`Created new browser. Pool size: ${this.browsers.length}`);
      } catch (error) {
        logger.error("Failed to create browser:", error);
        throw new Error("Failed to acquire browser from pool");
      }
    }

    // Wait for an available browser if pool is at max capacity
    if (!browser) {
      logger.warn("Browser pool at capacity, waiting for available browser...");
      browser = await this.waitForAvailableBrowser();
    }

    this.inUse.add(browser);
    browser._lastUsed = Date.now();

    return browser;
  }

  /**
   * Wait for a browser to become available
   */
  async waitForAvailableBrowser(timeout = 30000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (this.available.length > 0) {
        return this.available.shift();
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    throw new Error("Timeout waiting for available browser");
  }

  /**
   * Release a browser back to the pool
   */
  async release(browser) {
    if (!browser || !this.inUse.has(browser)) {
      return;
    }

    this.inUse.delete(browser);

    // Check if browser is still connected
    if (!browser.isConnected()) {
      this.removeBrowser(browser);
      return;
    }

    // Close all pages except one
    try {
      const pages = await browser.pages();
      for (let i = 1; i < pages.length; i++) {
        await pages[i].close();
      }
    } catch (error) {
      logger.error("Error cleaning up browser pages:", error);
      this.removeBrowser(browser);
      return;
    }

    browser._lastUsed = Date.now();
    this.available.push(browser);
  }

  /**
   * Remove a browser from the pool
   */
  removeBrowser(browser) {
    const index = this.browsers.indexOf(browser);
    if (index !== -1) {
      this.browsers.splice(index, 1);
    }

    const availableIndex = this.available.indexOf(browser);
    if (availableIndex !== -1) {
      this.available.splice(availableIndex, 1);
    }

    this.inUse.delete(browser);

    try {
      if (browser.isConnected()) {
        browser.close();
      }
    } catch (error) {
      logger.error("Error closing browser:", error);
    }
  }

  /**
   * Close idle browsers
   */
  async closeIdleBrowsers() {
    const now = Date.now();
    const browsersToRemove = [];

    for (const browser of this.available) {
      if (
        now - browser._lastUsed > this.idleTimeout &&
        this.browsers.length > this.minBrowsers
      ) {
        browsersToRemove.push(browser);
      }
    }

    for (const browser of browsersToRemove) {
      logger.info("Closing idle browser");
      this.removeBrowser(browser);
    }
  }

  /**
   * Shutdown the browser pool
   */
  async shutdown() {
    logger.info("Shutting down browser pool...");

    const allBrowsers = [...this.browsers];
    for (const browser of allBrowsers) {
      try {
        if (browser.isConnected()) {
          const pages = await browser.pages();
          await Promise.all(pages.map((page) => page.close().catch(() => {})));
          await browser.close();
        }
      } catch (error) {
        logger.error("Error closing browser during shutdown:", error);
      }
    }

    this.browsers = [];
    this.available = [];
    this.inUse.clear();
    this.initialized = false;

    logger.info("Browser pool shutdown complete");
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      total: this.browsers.length,
      available: this.available.length,
      inUse: this.inUse.size,
      maxCapacity: this.maxBrowsers,
    };
  }
}

// Export singleton instance
export const browserPool = new BrowserPool();

// Start idle browser cleanup interval
setInterval(() => {
  browserPool.closeIdleBrowsers();
}, 60000); // Check every minute
