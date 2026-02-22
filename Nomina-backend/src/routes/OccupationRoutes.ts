import { Router } from 'express';
import { requireAdmin, requireAuth } from '../middleware/auth.middleware';
import {
  createOccupation,
  deleteOccupation,
  getOccupationById,
  getOccupations,
  totalOccupation,
  updateOccupation,
} from '../controllers/OccupationController';

const router = Router();

router.get('/total', totalOccupation);
router.get('/', getOccupations);
router.get('/:id', getOccupationById);
router.post('/', requireAuth, requireAdmin, createOccupation);
router.put('/:id', requireAuth, requireAdmin, updateOccupation);
router.delete('/:id', requireAuth, requireAdmin, deleteOccupation);

export default router;
