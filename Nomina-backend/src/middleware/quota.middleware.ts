import type { Request, Response, NextFunction } from "express";
import prisma from "../utils/prisma";
import { logger } from "../utils/logger";
import { getPlan, getNextPeriodEnd } from "../config/plans";

/** Limites par plan */
const PLAN_LIMITS: Record<string, number> = {
  free: 1000,
  creator: 50_000,
  studio: 500_000,
};

/**
 * Middleware qui vérifie le quota de requêtes de l'utilisateur.
 * À placer sur les routes de génération (/generate, /generate-pack).
 *
 * Fonctionnement :
 * 1. Récupère le clerkUserId depuis req.auth (posé par le middleware auth)
 * 2. Trouve ou crée la Subscription
 * 3. Réinitialise le compteur si le cycle est expiré
 * 4. Vérifie si l'usage < limite
 * 5. Incrémente l'usage et logge
 */
export async function checkQuota(req: Request, res: Response, next: NextFunction) {
  const clerkUserId = (req as any).auth?.userId;

  // Sans auth, on laisse passer (le middleware auth bloquera si nécessaire)
  if (!clerkUserId) return next();

  try {
    // Upsert : crée la subscription si elle n'existe pas encore
    let sub = await prisma.subscription.findUnique({
      where: { clerkUserId },
    });

    if (!sub) {
      sub = await prisma.subscription.create({
        data: {
          clerkUserId,
          plan: "free",
          monthlyLimit: getPlan("free").standardLimit,
          currentUsage: 0,
          periodStart: new Date(),
          periodEnd: getNextPeriodEnd(),
        },
      });
    }

    // Réinitialiser le compteur si le cycle est expiré
    if (sub.periodEnd && new Date() > sub.periodEnd) {
      sub = await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          currentUsage: 0,
          periodStart: new Date(),
          periodEnd: getNextPeriodEnd(),
        },
      });
    }

    // Vérifier le quota
    if (sub.currentUsage >= sub.monthlyLimit) {
      res.status(429).json({
        error: "Quota mensuel atteint",
        plan: sub.plan,
        usage: sub.currentUsage,
        limit: sub.monthlyLimit,
        resetsAt: sub.periodEnd?.toISOString(),
        upgradeUrl: "/pricing",
      });
      return;
    }

    // Incrémenter l'usage + logger (en parallèle, non-bloquant)
    prisma
      .$transaction([
        prisma.subscription.update({
          where: { id: sub.id },
          data: { currentUsage: { increment: 1 } },
        }),
        prisma.usageLog.create({
          data: {
            subscriptionId: sub.id,
            endpoint: req.path,
          },
        }),
      ])
      .catch((err) => logger.error("Erreur usage log", { err }));

    // Ajouter les infos de quota dans la réponse (header)
    res.setHeader("X-Quota-Used", String(sub.currentUsage + 1));
    res.setHeader("X-Quota-Limit", String(sub.monthlyLimit));
    res.setHeader("X-Quota-Plan", sub.plan);

    next();
  } catch (err) {
    logger.error("Erreur checkQuota", { err, clerkUserId });
    // En cas d'erreur, on laisse passer (fail-open) pour ne pas bloquer l'UX
    next();
  }
}

