import { Router } from 'express';
import { requireAdmin, requireAuth } from '../middleware/auth.middleware';
import {
  createOrganization,
  deleteOrganization,
  getOrganizationById,
  getOrganizations,
  totalOrganization,
  updateOrganization,
} from '../controllers/OrganizationController';

const router = Router();

router.get('/total', totalOrganization);
router.get('/', getOrganizations);
router.get('/:id', getOrganizationById);
router.post('/', requireAuth, requireAdmin, createOrganization);
router.put('/:id', requireAuth, requireAdmin, updateOrganization);
router.delete('/:id', requireAuth, requireAdmin, deleteOrganization);

export default router;
