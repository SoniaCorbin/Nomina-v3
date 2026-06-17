import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { isKnownPrismaError } from "../utils/prismaErrors";
import { logger } from "../utils/logger";

/**
 * Classe d'erreur métier. Lance-la depuis les contrôleurs avec un statut HTTP
 * et un message utilisateur — `errorHandler` s'occupe du reste.
 *
 *   throw new AppError(404, "Culture non trouvée");
 *   throw new AppError(400, "Id invalide", { issues: [...] });
 */
export class AppError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.details = details;
  }
}

/**
 * Enveloppe les handlers async pour que toute Promise rejetée file dans
 * `next()` au lieu de produire un unhandledRejection. Plus de try/catch
 * boilerplate dans les contrôleurs.
 *
 *   router.get("/", asyncHandler(getCultures));
 */
export const asyncHandler =
  <T extends Request = Request>(
    fn: (req: T, res: Response, next: NextFunction) => Promise<unknown>,
  ) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req as T, res, next)).catch(next);
  };

/**
 * Middleware d'erreur centralisé. À monter en DERNIER, après toutes les
 * routes. Couvre Zod, AppError, erreurs Prisma connues, et tout le reste.
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  const reqId = (req as Request & { id?: string }).id;

  // 1) AppError (cas métier explicite)
  if (err instanceof AppError) {
    res.status(err.status).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
      reqId,
    });
    return;
  }

  // 2) Zod (validation)
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Paramètres invalides",
      issues: err.issues,
      reqId,
    });
    return;
  }

  // 3) Prisma — erreurs connues mappées sur des codes HTTP appropriés
  if (isKnownPrismaError(err, "P2002")) {
    res.status(409).json({ error: "Conflit: valeur unique déjà utilisée", reqId });
    return;
  }
  if (isKnownPrismaError(err, "P2025")) {
    res.status(404).json({ error: "Ressource non trouvée", reqId });
    return;
  }
  if (isKnownPrismaError(err, "P2003")) {
    res.status(409).json({
      error: "Impossible: ressource encore référencée par d'autres entités",
      reqId,
    });
    return;
  }

  // 4) Erreurs CORS — explicites, pas un 500
  if (err instanceof Error && (err as Error).message.startsWith("CORS:")) {
  res.status(403).json({ error: (err as Error).message, reqId });
  return;
  }

  // 5) Tout le reste — 500 opaque côté client, stack côté logs
  logger.error("Unhandled error", {
    err,
    reqId,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    error: "Erreur serveur",
    reqId,
  });
}

/**
 * Catch-all 404 — branche-le juste avant `errorHandler` pour que toute route
 * inconnue passe par le format d'erreur uniforme.
 */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(new AppError(404, `Route inconnue: ${req.method} ${req.originalUrl}`));
}
