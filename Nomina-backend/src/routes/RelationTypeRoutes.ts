import { Router } from 'express';
import { requireAdmin, requireAuth } from '../middleware/auth.middleware';
import {
  createRelationType,
  deleteRelationType,
  getRelationTypeById,
  getRelationTypes,
  totalRelationType,
  updateRelationType,
} from '../controllers/RelationTypeController';

const router = Router();

router.get('/total', totalRelationType);
router.get('/', getRelationTypes);
router.get('/:id', getRelationTypeById);
router.post('/', requireAuth, requireAdmin, createRelationType);
router.put('/:id', requireAuth, requireAdmin, updateRelationType);
router.delete('/:id', requireAuth, requireAdmin, deleteRelationType);

export default router;
