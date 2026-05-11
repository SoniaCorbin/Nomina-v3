import type { NextFunction, Request, RequestHandler, Response } from "express";
import crypto from "crypto";
import helmet from "helmet";

/**
 * En-têtes de sécurité standards. Remplace l'ancien `securityHeaders` maison
 * qui ne posait que `X-Frame-Options: DENY` (et oubliait `next()`, donc ne
 * marchait pas en pratique).
 *
 * CSP désactivée par défaut (API JSON, pas de HTML servi). Si tu sers un
 * Swagger UI plus tard, on la réactivera avec une politique spécifique.
 */
export const securityHeaders: RequestHandler = helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }, // pour les /uploads
});

/**
 * Attache un identifiant unique à chaque requête (`req.id`) et le renvoie dans
 * l'en-tête `X-Request-Id`. Utile pour corréler logs côté serveur et bugs
 * remontés par les clients. Reprend l'en-tête entrant si présent (utile
 * derrière un reverse proxy qui l'a déjà posé).
 */
export function requestId(req: Request, res: Response, next: NextFunction) {
  const incoming = req.header("X-Request-Id");
  const id = incoming && incoming.length <= 64 ? incoming : crypto.randomUUID();
  (req as Request & { id?: string }).id = id;
  res.setHeader("X-Request-Id", id);
  next();
}
