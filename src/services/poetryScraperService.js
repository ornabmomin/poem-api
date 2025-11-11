/**
 * Poetry Scraper Service
 * Handles web scraping of poetry content from Poetry Foundation
 */

import { SCRAPING_CONSTANTS, config } from "../config/index.js";
import { browserPool } from "../utils/browserPool.js";
import { cache } from "../utils/cache.js";
import { logger } from "../utils/logger.js";

/**
 * Scrape Poem of the Day with audio
 */
async function scrapePoemOfTheDay(page) {
  try {
    await page.goto(SCRAPING_CONSTANTS.potD.url, {
      waitUntil: "domcontentloaded",
      timeout: config.puppeteer.timeout,
    });

    // Wait a bit for dynamic content to load
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const title = await page
      .$eval(SCRAPING_CONSTANTS.potD.selectors.title, (el) =>
        el.textContent?.trim()
      )
      .catch(() => null);

    const description = await page
      .$eval(SCRAPING_CONSTANTS.potD.selectors.description, (el) =>
        el.textContent?.trim()
      )
      .catch(() => null);

    const listenButton = await page.$(
      SCRAPING_CONSTANTS.potD.selectors.listenButton
    );

    if (!listenButton) {
      logger.debug("Listen button not found for Poem of the Day");
      return { title, description, audioSrc: null };
    }

    await listenButton.click();

    // Wait for audio element to appear
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const audioElement = await page
      .waitForSelector(SCRAPING_CONSTANTS.potD.selectors.audio, {
        timeout: 5000,
      })
      .catch(() => null);

    const audioSrc = audioElement
      ? await page.$eval(
          SCRAPING_CONSTANTS.potD.selectors.audio,
          (el) => el.src
        )
      : null;

    logger.info("Successfully scraped Poem of the Day", {
      hasAudio: !!audioSrc,
    });

    return {
      type: "Poem of the Day",
      title,
      description,
      audioSrc,
    };
  } catch (error) {
    logger.error("Error scraping Poem of the Day:", error);
    throw error;
  }
}

/**
 * Scrape Audio Poem of the Day
 */
async function scrapeAudioPoemOfTheDay(page) {
  try {
    await page.goto(SCRAPING_CONSTANTS.audioPoTD.url, {
      waitUntil: "domcontentloaded",
      timeout: config.puppeteer.timeout,
    });

    // Wait a bit for dynamic content to load
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const title = await page
      .$eval(SCRAPING_CONSTANTS.audioPoTD.selectors.title, (el) =>
        el.textContent?.trim()
      )
      .catch(() => null);

    const description = await page
      .$eval(SCRAPING_CONSTANTS.audioPoTD.selectors.description, (el) =>
        el.textContent?.trim()
      )
      .catch(() => null);

    const date = await page
      .$eval(SCRAPING_CONSTANTS.audioPoTD.selectors.date, (el) =>
        el.textContent?.trim()
      )
      .catch(() => null);

    const audioSrc = await page
      .$eval(SCRAPING_CONSTANTS.audioPoTD.selectors.audio, (el) => el.src)
      .catch(() => null);

    logger.info("Successfully scraped Audio Poem of the Day", {
      hasAudio: !!audioSrc,
    });

    return {
      type: "Audio Poem of the Day",
      title,
      description,
      audioSrc,
      date,
    };
  } catch (error) {
    logger.error("Error scraping Audio Poem of the Day:", error);
    throw error;
  }
}

/**
 * Get all poetry episodes with retry logic
 */
export async function getPoetryEpisodes() {
  const cacheKey = "poetry-episodes";

  // Check cache first
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    logger.info("Returning cached poetry episodes");
    return cachedData;
  }

  let browser = null;
  let page = null;

  try {
    logger.info("Acquiring browser from pool...");
    browser = await browserPool.acquire();
    page = await browser.newPage();

    // Set viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // Scrape both sources sequentially for more reliability
    const poemOfTheDay = await scrapePoemOfTheDay(page).catch((error) => {
      logger.warn("Failed to scrape Poem of the Day", { error: error.message });
      return { status: "rejected", reason: error };
    });

    const audioPoemOfTheDay = await scrapeAudioPoemOfTheDay(page).catch(
      (error) => {
        logger.warn("Failed to scrape Audio Poem of the Day", {
          error: error.message,
        });
        return { status: "rejected", reason: error };
      }
    );

    const results = [];

    if (poemOfTheDay && poemOfTheDay.audioSrc) {
      results.push(poemOfTheDay);
    }

    if (audioPoemOfTheDay && audioPoemOfTheDay.audioSrc) {
      results.push(audioPoemOfTheDay);
    }

    if (results.length === 0) {
      throw new Error("No audio poems found from either source");
    }

    // Cache the results
    cache.set(cacheKey, results);

    return results;
  } catch (error) {
    logger.error("Error fetching poetry episodes:", error);
    throw error;
  } finally {
    // Clean up
    if (page) {
      await page
        .close()
        .catch((err) => logger.error("Error closing page:", err));
    }
    if (browser) {
      await browserPool.release(browser);
    }
  }
}

/**
 * Clear poetry cache
 */
export function clearPoetryCache() {
  cache.delete("poetry-episodes");
  logger.info("Poetry cache cleared");
}
