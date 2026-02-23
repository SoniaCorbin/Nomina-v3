import { Router } from "express";
import path from "path";
import multer from "multer";
import { requireAdmin, requireAuth } from "../middleware/auth.middleware";
import { ensureUploadsSubdir } from "../utils/uploads";
import {
  getCultures,
  getCultureById,
  createCulture,
  updateCulture,
  deleteCulture,
  totalCulture,
  uploadCultureImage,
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

router.get("/total", totalCulture);
router.get("/", getCultures);
router.get("/:id", getCultureById);
// CRUD admin: écritures protégées
router.post("/", requireAuth, requireAdmin, createCulture);
router.put("/:id", requireAuth, requireAdmin, updateCulture);
router.post("/:id/image", requireAuth, requireAdmin, upload.single("image"), uploadCultureImage);
router.delete("/:id", requireAuth, requireAdmin, deleteCulture);

export default router;