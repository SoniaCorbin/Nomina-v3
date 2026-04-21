import { Router } from "express";
import { generatePackController } from "../controllers/GeneratePackController";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.post("/", requireAuth, generatePackController);

export default router;
