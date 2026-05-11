import { Router } from "express";
import path from "path";
import multer from "multer";

import { requireAdmin, requireAuth } from "../middleware/auth.middleware";
import { writeLimiter } from "../middleware/rateLimit.middleware";
import { ensureUploadsSubdir } from "../utils/uploads";
import {
  createCulture,
  deleteCulture,
  getCultureById,
  getCultures,
  totalCulture,
  updateCulture,
  uploadCultureImage,
  validateCultureCreate,
  validateCultureId,
  validateCultureList,
  validateCultureUpdate,
} from "../controllers/CultureController";

const router = Router();

const uploadDir = ensureUploadsSubdir("cultures");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeExt = ext && ext.length <= 6 ? ext : ".jpg";
    cb(null, `culture-${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype?.startsWith("image/")) {
      return cb(new Error("Le fichier doit être une image"));
    }
    return cb(null, true);
  },
});

// Lectures publiques (paginées maintenant)
router.get("/total", totalCulture);
router.get("/", validateCultureList, getCultures);
router.get("/:id", validateCultureId, getCultureById);

// Écritures admin uniquement, sous rate-limit "write"
router.post("/", requireAuth, requireAdmin, writeLimiter, validateCultureCreate, createCulture);
router.put("/:id", requireAuth, requireAdmin, writeLimiter, validateCultureId, validateCultureUpdate, updateCulture);
router.post(
  "/:id/image",
  requireAuth,
  requireAdmin,
  writeLimiter,
  validateCultureId,
  upload.single("image"),
  uploadCultureImage,
);
router.delete("/:id", requireAuth, requireAdmin, writeLimiter, validateCultureId, deleteCulture);

export default router;
