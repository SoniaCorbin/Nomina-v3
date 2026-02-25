import { Router } from "express";
import { generatePackController } from "../controllers/GeneratePackController";

const router = Router();

router.post("/", generatePackController);

export default router;
