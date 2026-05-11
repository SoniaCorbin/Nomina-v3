import type { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { Prisma } from "../generated/prisma/client";
import { logger } from "../utils/logger";

/**
 * Gestionnaire d'erreurs centralisé — à monter EN DERNIER dans app.ts.
 *
 * Gère dans l'ordre :
 *  1. Erreurs Zod (validation)  → 400
 *  2. Erreurs Prisma connues    → 404 / 409 selon le code
 *  3. Erreurs avec .status      → status fourni
 *  4. Tout le reste             → 500 (message générique, stack loggée)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // 1. Zod
  if (err instanceof ZodError) {
    res.status(400).json({ error: "Payload invalide", issues: err.issues });
    return;
  }

  // 2. Prisma — erreurs de requête connues
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({ error: "Valeur déjà utilisée (contrainte d'unicité)" });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({ error: "Enregistrement introuvable" });
      return;
    }
    if (err.code === "P2003") {
      res.status(409).json({ error: "Impossible de supprimer : encore référencé" });
      return;
    }
  }

  // 3. Prisma — problème de connexion / validation interne
  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({ error: "Requête base de données invalide" });
    return;
  }

  // 4. Erreurs HTTP explicites (ex: new Error('Not found') avec .status = 404)
  const status = typeof (err as { status?: unknown }).status === "number"
    ? (err as { status: number }).status
    : 500;

  if (status < 500) {
    res.status(status).json({ error: err.message ?? "Erreur" });
    return;
  }

  // 5. 500 — log côté serveur, message générique côté client
  logger.error("Unhandled error", { err });
  res.status(500).json({ error: "Erreur serveur" });
};
