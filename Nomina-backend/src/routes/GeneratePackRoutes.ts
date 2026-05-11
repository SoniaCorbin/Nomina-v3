import { Router } from "express";
import { generatePack } from "../controllers/GeneratePackController";
import { requireAuth } from "../middleware/auth.middleware";
import { aiLimiter } from "../middleware/rateLimit.middleware";

const router = Router();

/**
 * POST /api/generate-pack
 *
 * Protections ajoutées en v4 :
 *   - `requireAuth` : exige un Bearer token Clerk valide. La consommation est
 *     traçable par utilisateur (utile pour le quota et l'audit OpenAI).
 *   - `aiLimiter`   : 10 requêtes / 10 min / utilisateur (ou IP en fallback).
 *
 * Avant ce patch, la route était publique et sans plafond — un script trivial
 * pouvait vider la clé OpenAI en quelques minutes.
 */
router.post("/", requireAuth, aiLimiter, generatePack);

export default router;
