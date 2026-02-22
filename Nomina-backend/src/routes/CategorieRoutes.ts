import { Router } from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import { requireAdmin, requireAuth } from "../middleware/auth.middleware";
import {
  getCategories,
  getCategorieById,
  createCategorie,
  updateCategorie,
  deleteCategorie,
  totalCategorie,
  uploadCategorieImage,
} from "../controllers/CategorieController";

const router = Router();

const uploadDir = path.join(process.cwd(), "uploads", "categories");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeExt = ext && ext.length <= 6 ? ext : ".jpg";
    cb(null, `categorie-${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
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

router.get("/total", totalCategorie);
router.get("/", getCategories);
router.get("/:id", getCategorieById);
router.post("/", requireAuth, requireAdmin, createCategorie);
router.put("/:id", requireAuth, requireAdmin, updateCategorie);
router.post("/:id/image", requireAuth, requireAdmin, upload.single("image"), uploadCategorieImage);
router.delete("/:id", requireAuth, requireAdmin, deleteCategorie);

export default router;
