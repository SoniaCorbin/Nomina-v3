import { Router } from 'express';
import path from 'path';
import multer from 'multer';
import {getLieux, getLieuById, createLieu, updateLieu, deleteLieu, totalLieux} from '../controllers/LieuxController';
import { requireAdmin, requireAuth } from "../middleware/auth.middleware";
import { uploadLieuImage } from '../controllers/LieuxController';
import { ensureUploadsSubdir } from '../utils/uploads';

const router = Router();

const uploadDir = ensureUploadsSubdir('lieux');

const storage = multer.diskStorage({
	destination: (_req, _file, cb) => cb(null, uploadDir),
	filename: (_req, file, cb) => {
		const ext = path.extname(file.originalname || '').toLowerCase();
		const safeExt = ext && ext.length <= 6 ? ext : '.jpg';
		cb(null, `lieu-${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
	},
});

const upload = multer({
	storage,
	limits: { fileSize: 5 * 1024 * 1024 },
	fileFilter: (_req, file, cb) => {
		if (!file.mimetype?.startsWith('image/')) {
			return cb(new Error('Le fichier doit être une image'));
		}
		return cb(null, true);
	},
});

router.get('/', getLieux);
// Définir /total avant /:id pour éviter que "total" soit interprété comme un id
router.get('/total', totalLieux);
router.get('/:id', getLieuById);
router.post('/', requireAuth, requireAdmin, createLieu);
router.put('/:id', requireAuth, requireAdmin, updateLieu);
router.post('/:id/image', requireAuth, requireAdmin, upload.single('image'), uploadLieuImage);
router.delete('/:id', requireAuth, requireAdmin, deleteLieu);

export default router;