import { Router } from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import {
	getUniversThematiques,
	getUniversThematiquesAdmin,
	getUniversThematiqueById,
	createUniversThematique,
	updateUniversThematique,
	deleteUniversThematique,
	uploadUniversThematiqueImage,
} from "../controllers/UniversThematiqueController";
import { requireAdmin, requireAuth } from "../middleware/auth.middleware";

const router = Router();

const uploadDir = path.join(process.cwd(), "uploads", "univers");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
	destination: (_req, _file, cb) => cb(null, uploadDir),
	filename: (_req, file, cb) => {
		const ext = path.extname(file.originalname || "").toLowerCase();
		const safeExt = ext && ext.length <= 6 ? ext : ".jpg";
		cb(null, `univers-${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
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

router.get("/", getUniversThematiques);
router.get("/all", getUniversThematiquesAdmin);
router.get("/:id", getUniversThematiqueById);

router.post("/", requireAuth, requireAdmin, createUniversThematique);
router.put("/:id", requireAuth, requireAdmin, updateUniversThematique);
router.post("/:id/image", requireAuth, requireAdmin, upload.single("image"), uploadUniversThematiqueImage);
router.delete("/:id", requireAuth, requireAdmin, deleteUniversThematique);

export default router;