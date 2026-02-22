import { Router } from 'express';
import { requireAdmin, requireAuth } from '../middleware/auth.middleware';
import {
  createSocialClass,
  deleteSocialClass,
  getSocialClassById,
  getSocialClasses,
  totalSocialClass,
  updateSocialClass,
} from '../controllers/SocialClassController';

const router = Router();

router.get('/total', totalSocialClass);
router.get('/', getSocialClasses);
router.get('/:id', getSocialClassById);
router.post('/', requireAuth, requireAdmin, createSocialClass);
router.put('/:id', requireAuth, requireAdmin, updateSocialClass);
router.delete('/:id', requireAuth, requireAdmin, deleteSocialClass);

export default router;
