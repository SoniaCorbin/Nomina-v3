import { Router, raw } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import {
  createCheckout,
  createPortal,
  getUsage,
  handleWebhook,
} from "../controllers/BillingController";

const router = Router();

// Le webhook Stripe DOIT recevoir le body brut (pas JSON parsé).
// On le monte ici avec express.raw() au lieu de express.json().
router.post("/webhook", raw({ type: "application/json" }), handleWebhook);

// Routes authentifiées
router.post("/checkout", requireAuth, createCheckout);
router.post("/portal", requireAuth, createPortal);
router.get("/usage", requireAuth, getUsage);

export default router;