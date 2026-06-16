/**
 * Configuration centralisée des plans tarifaires Nomina.
 * Source unique de vérité — importée par le middleware quota,
 * le BillingController et le frontend (via /api/billing/plans).
 */

export interface PlanConfig {
  name: string;          // Nom affiché
  standardLimit: number; // Requêtes standard / mois (generate)
  aiLimit: number;       // Requêtes IA / mois (generate-pack)
  priceCAD: number;      // Prix mensuel en CAD
  stripePriceId: string | null; // Stripe Price ID (null = gratuit)
}

export const PLANS: Record<string, PlanConfig> = {
  free: {
    name: "Découverte",
    standardLimit: 500,
    aiLimit: 10,
    priceCAD: 0,
    stripePriceId: null,
  },
  creator: {
    name: "Créateur",
    standardLimit: 10_000,
    aiLimit: 200,
    priceCAD: 12,
    stripePriceId: process.env.STRIPE_PRICE_CREATOR || null,
  },
  studio: {
    name: "Studio",
    standardLimit: 100_000,
    aiLimit: 2_000,
    priceCAD: 49,
    stripePriceId: process.env.STRIPE_PRICE_STUDIO || null,
  },
};

/** Retourne la config d'un plan (fallback sur free). */
export function getPlan(planId: string): PlanConfig {
  return PLANS[planId] ?? PLANS.free;
}

/** Liste des plan IDs valides pour la validation Zod. */
export const PLAN_IDS = Object.keys(PLANS) as [string, ...string[]];

/** Retourne la date du 1er du mois suivant (renouvellement). */
export function getNextPeriodEnd(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}