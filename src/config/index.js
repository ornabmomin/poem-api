/**
 * Configuration management for the Poetry API
 * Centralizes all environment variables and constants
 */

export const config = {
  // Server configuration
  server: {
    port: parseInt(process.env.PORT || "3000", 10),
    host: process.env.HOST || "0.0.0.0",
    nodeEnv: process.env.NODE_ENV || "development",
  },

  // Puppeteer configuration
  puppeteer: {
    headless: process.env.PUPPETEER_HEADLESS !== "false",
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
    timeout: parseInt(process.env.PUPPETEER_TIMEOUT || "10000", 10),
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    ],
  },

  // Browser pool configuration
  browserPool: {
    min: parseInt(process.env.BROWSER_POOL_MIN || "1", 10),
    max: parseInt(process.env.BROWSER_POOL_MAX || "3", 10),
    idleTimeout: parseInt(process.env.BROWSER_IDLE_TIMEOUT || "30000", 10),
  },

  // Cache configuration
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || "300000", 10), // 5 minutes default
    enabled: process.env.CACHE_ENABLED !== "false",
  },

  // Rate limiting configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || "60000", 10), // 1 minute
    max: parseInt(process.env.RATE_LIMIT_MAX || "10", 10), // 10 requests per minute
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || "info",
  },
};

/**
 * Selectors and URLs for Poetry Foundation scraping
 */
export const SCRAPING_CONSTANTS = {
  potD: {
    url: "https://www.poetryfoundation.org/",
    selectors: {
      title:
        "#mainContent > main > div > section.my-4.mb-7.border-t-4.border-gray-300.py-4 > div > div.col-span-full.flex.flex-col.md\\:col-span-3.md\\:gap-3 > div:nth-child(1) > h3 > div > a > span",
      description:
        "#mainContent > main > div > section.my-4.mb-7.border-t-4.border-gray-300.py-4 > div > div.col-span-full.flex.flex-col.md\\:col-span-3.md\\:gap-3 > div.type-kappa.text-gray-600",
      audio:
        "#mainContent > main > div > section.my-4.mb-7.border-t-4.border-gray-300.py-4 > div > div.col-span-full.flex.flex-col.md\\:col-span-3.md\\:gap-3 > div.type-xi.flex.flex-wrap.gap-2.leading-\\[\\.8\\].text-black > div > div > audio",
      listenButton:
        "#mainContent > main > div > section.my-4.mb-7.border-t-4.border-gray-300.py-4 > div > div.col-span-full.flex.flex-col.md\\:col-span-3.md\\:gap-3 > div.type-xi.flex.flex-wrap.gap-2.leading-\\[\\.8\\].text-black > button > span",
    },
  },
  audioPoTD: {
    url: "https://www.poetryfoundation.org/podcasts/series/74634/audio-pod",
    selectors: {
      title:
        "#mainContent > article > div.flex.flex-col.gap-5.md\\:flex-row-reverse.md\\:gap-8 > div > header > h1 > p",
      description:
        "#mainContent > article > div.flex.flex-col.gap-5.md\\:flex-row-reverse.md\\:gap-8 > div > div.flex.flex-col.gap-4.sm\\:flex-row > div > div.copy-large.undefined.rich-text > p",
      date: "#mainContent > article > div.flex.flex-col.gap-5.md\\:flex-row-reverse.md\\:gap-8 > div > header > time",
      audio:
        "#mainContent > article > div.flex.flex-col.gap-5.md\\:flex-row-reverse.md\\:gap-8 > div > div.mb-6.grid.gap-6 > div > div > audio",
    },
  },
};
