import type { Request, Response } from "express";
import Stripe from "stripe";
import prisma from "../utils/prisma";
import { logger } from "../utils/logger";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/** Limites par plan — doit correspondre au middleware quota */
const PLAN_CONFIG: Record<string, { limit: number; name: string }> = {
  free: { limit: 1000, name: "Découverte" },
  creator: { limit: 50_000, name: "Créateur" },
  studio: { limit: 500_000, name: "Studio" },
};

/**
 * POST /api/billing/checkout
 * Crée une session Stripe Checkout et redirige le client.
 */
export async function createCheckout(req: Request, res: Response) {
  const clerkUserId = (req as any).auth?.userId;
  if (!clerkUserId) {
    res.status(401).json({ error: "Non authentifié" });
    return;
  }

  const { plan } = req.body; // "creator" | "studio"
  if (!plan || !["creator", "studio"].includes(plan)) {
    res.status(400).json({ error: "Plan invalide. Choisis 'creator' ou 'studio'." });
    return;
  }

  try {
    // Trouver ou créer le customer Stripe
    let sub = await prisma.subscription.findUnique({ where: { clerkUserId } });
    let customerId = sub?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { clerkUserId },
      });
      customerId = customer.id;

      // Upsert la subscription locale
      if (sub) {
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { stripeCustomerId: customerId },
        });
      } else {
        await prisma.subscription.create({
          data: {
            clerkUserId,
            stripeCustomerId: customerId,
            plan: "free",
            monthlyLimit: PLAN_CONFIG.free.limit,
          },
        });
      }
    }

    // Créer la session Checkout
    // NOTE: Remplace les price IDs par ceux créés dans ton dashboard Stripe
    const priceId =
      plan === "creator"
        ? process.env.STRIPE_PRICE_CREATOR!
        : process.env.STRIPE_PRICE_STUDIO!;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}/dashboard?checkout=success`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing?checkout=cancel`,
      metadata: { clerkUserId, plan },
    });

    res.json({ url: session.url });
  } catch (err) {
    logger.error("Erreur createCheckout", { err, clerkUserId, plan });
    res.status(500).json({ error: "Erreur lors de la création du checkout" });
  }
}

/**
 * POST /api/billing/portal
 * Redirige vers le portail client Stripe (gérer/annuler l'abonnement).
 */
export async function createPortal(req: Request, res: Response) {
  const clerkUserId = (req as any).auth?.userId;
  if (!clerkUserId) {
    res.status(401).json({ error: "Non authentifié" });
    return;
  }

  try {
    const sub = await prisma.subscription.findUnique({ where: { clerkUserId } });
    if (!sub?.stripeCustomerId) {
      res.status(404).json({ error: "Aucun abonnement trouvé" });
      return;
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL}/dashboard`,
    });

    res.json({ url: session.url });
  } catch (err) {
    logger.error("Erreur createPortal", { err, clerkUserId });
    res.status(500).json({ error: "Erreur lors de l'ouverture du portail" });
  }
}

/**
 * GET /api/billing/usage
 * Retourne l'usage courant de l'utilisateur.
 */
export async function getUsage(req: Request, res: Response) {
  const clerkUserId = (req as any).auth?.userId;
  if (!clerkUserId) {
    res.status(401).json({ error: "Non authentifié" });
    return;
  }

  try {
    const sub = await prisma.subscription.findUnique({ where: { clerkUserId } });

    if (!sub) {
      res.json({
        plan: "free",
        planName: "Découverte",
        usage: 0,
        limit: PLAN_CONFIG.free.limit,
        percentage: 0,
        resetsAt: null,
      });
      return;
    }

    const percentage = Math.round((sub.currentUsage / sub.monthlyLimit) * 100);

    res.json({
      plan: sub.plan,
      planName: PLAN_CONFIG[sub.plan]?.name ?? sub.plan,
      usage: sub.currentUsage,
      limit: sub.monthlyLimit,
      percentage,
      resetsAt: sub.periodEnd?.toISOString() ?? null,
    });
  } catch (err) {
    logger.error("Erreur getUsage", { err, clerkUserId });
    res.status(500).json({ error: "Erreur serveur" });
  }
}

/**
 * POST /api/billing/webhook
 * Webhook Stripe — met à jour le plan quand un paiement est confirmé.
 * IMPORTANT : cette route doit recevoir le body RAW (pas JSON parsé).
 */
export async function handleWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: any;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    logger.error("Webhook signature invalide", { err });
    res.status(400).json({ error: "Signature invalide" });
    return;
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const clerkUserId = session.metadata?.clerkUserId;
        const plan = session.metadata?.plan;

        if (clerkUserId && plan) {
          await prisma.subscription.upsert({
            where: { clerkUserId },
            update: {
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              plan,
              monthlyLimit: PLAN_CONFIG[plan]?.limit ?? 1000,
              status: "active",
              currentUsage: 0,
              periodStart: new Date(),
              periodEnd: getNextPeriodEnd(),
            },
            create: {
              clerkUserId,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              plan,
              monthlyLimit: PLAN_CONFIG[plan]?.limit ?? 1000,
              status: "active",
              periodStart: new Date(),
              periodEnd: getNextPeriodEnd(),
            },
          });
          logger.info("Plan activé", { clerkUserId, plan });
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as any;
        const status = sub.cancel_at_period_end ? "canceled" : "active";

        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: { status },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as any;

        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: {
            plan: "free",
            monthlyLimit: PLAN_CONFIG.free.limit,
            status: "canceled",
            stripeSubscriptionId: null,
          },
        });
        logger.info("Abonnement annulé, retour au plan gratuit", {
          stripeSubscriptionId: sub.id,
        });
        break;
      }
    }

    res.json({ received: true });
  } catch (err) {
    logger.error("Erreur traitement webhook", { err, eventType: event.type });
    res.status(500).json({ error: "Erreur interne" });
  }
}

function getNextPeriodEnd(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}