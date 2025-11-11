/**
 * Poetry API Routes
 * Handles all poetry-related endpoints
 */

import express from "express";
import {
  getPoetryEpisodes,
  clearPoetryCache,
} from "../services/poetryScraperService.js";
import { asyncHandler, ApiError } from "../middleware/errorHandler.js";
import { cache } from "../utils/cache.js";
import { browserPool } from "../utils/browserPool.js";

const router = express.Router();

/**
 * GET /api/poetry-episode
 * Fetch poetry episodes with audio
 */
router.get(
  "/poetry-episode",
  asyncHandler(async (req, res) => {
    const episodes = await getPoetryEpisodes();

    if (!episodes || episodes.length === 0) {
      throw new ApiError("No audio poems found", 404, true);
    }

    res.json(episodes);
  })
);

/**
 * GET /api/cache/clear
 * Clear the poetry cache (useful for testing)
 */
router.post(
  "/cache/clear",
  asyncHandler(async (req, res) => {
    clearPoetryCache();
    res.json({
      success: true,
      message: "Poetry cache cleared successfully",
    });
  })
);

/**
 * GET /api/cache/stats
 * Get cache statistics
 */
router.get("/cache/stats", (req, res) => {
  const stats = cache.getStats();
  res.json(stats);
});

/**
 * GET /api/pool/stats
 * Get browser pool statistics
 */
router.get("/pool/stats", (req, res) => {
  const stats = browserPool.getStats();
  res.json(stats);
});

export default router;
