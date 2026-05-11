import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import type { Request } from "express";

/**
 * Clé personnalisée : si l'utilisateur est authentifié (Clerk), on limite par
 * userId ; sinon on retombe sur l'IP. Empêche un utilisateur authentifié de
 * contourner la limite via plusieurs IPs (et inversement).
 */
const keyByUserOrIp = (req: Request): string => {
  const userId = (req as Request & { auth?: { userId?: string } }).auth?.userId;
  if (userId) return `user:${userId}`;
  return `ip:${ipKeyGenerator(req.ip ?? "unknown")}`;
};

/**
 * Limite stricte pour les endpoints qui appellent OpenAI. Chaque requête coûte
 * potentiellement plusieurs centimes — on ne laisse pas une boucle vider la clé.
 *
 *   10 requêtes / 10 minutes / utilisateur (ou IP en fallback)
 */
export const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: keyByUserOrIp,
  message: {
    error: "Trop de requêtes IA, réessaie dans quelques minutes",
  },
});

/**
 * Limite plus permissive pour les routes d'écriture (POST/PUT/DELETE).
 *   60 requêtes / minute / utilisateur (ou IP)
 */
export const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: keyByUserOrIp,
  message: { error: "Trop d'écritures, ralentis un peu" },
});

/**
 * Filet de sécurité global. Très large — sert juste à bloquer les bots.
 *   600 requêtes / minute / IP
 */
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 600,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  message: { error: "Trop de requêtes, réessaie dans une minute" },
});
