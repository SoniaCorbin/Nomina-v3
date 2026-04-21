import { Router } from "express";
import {
  generateNpcs,
  generateNomPersonnages,
  generateNomFamille,
  generateLieux,
  generateFragmentsHistoire,
  generateTitres,
  generateConcepts,
} from "../controllers/GenerateController";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/npcs", requireAuth, generateNpcs);
router.get("/nom-personnages", requireAuth, generateNomPersonnages);
router.get("/prenoms", requireAuth, generateNomPersonnages);
router.get("/nom-famille", requireAuth, generateNomFamille);
router.get("/lieux", requireAuth, generateLieux);
router.get("/fragments-histoire", requireAuth, generateFragmentsHistoire);
router.get("/titres", requireAuth, generateTitres);
router.get("/concepts", requireAuth, generateConcepts);

export default router;