import { Router } from 'express';
import path from 'path';
import multer from 'multer';
import {
  getCreatures,
  getCreatureById,
  createCreature,
  updateCreature,
  deleteCreature,
  totalCreatures,
  uploadCreatureImage,
} from '../controllers/CreatureController';
import { requireAdmin, requireAuth } from '../middleware/auth.middleware';
import { ensureUploadsSubdir } from '../utils/uploads';

const router = Router();

const uploadDir = ensureUploadsSubdir('creatures');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeExt = ext && ext.length <= 6 ? ext : '.jpg';
    cb(null, `creature-${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
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

router.get('/', getCreatures);
router.get('/total', totalCreatures);
router.get('/:id', getCreatureById);
router.post('/', requireAuth, requireAdmin, createCreature);
router.put('/:id', requireAuth, requireAdmin, updateCreature);
router.post('/:id/image', requireAuth, requireAdmin, upload.single('image'), uploadCreatureImage);
router.delete('/:id', requireAuth, requireAdmin, deleteCreature);

export default router;
