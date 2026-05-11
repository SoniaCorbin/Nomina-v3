import type { Request, Response, NextFunction, RequestHandler } from "express";

type AsyncFn = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/**
 * Enveloppe un handler async pour que toute erreur non-catchée
 * soit transmise au middleware errorHandler central via next(err).
 *
 * Avant :
 *   export const getXxx = async (req, res) => { try { ... } catch(e) { res.status(500)... } }
 *
 * Après :
 *   export const getXxx = asyncHandler(async (req, res) => { ... })
 */
export function asyncHandler(fn: AsyncFn): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
