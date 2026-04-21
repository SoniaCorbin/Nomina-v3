import { Router } from 'express';
import {
	adminPingController,
	approveAdminRequestController,
	createAdminRequestController,
	listAdminRequestsController,
	meController,
	rejectAdminRequestController,
} from '../controllers/AuthController';
import { requireAdmin, requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/me', requireAuth, meController);
router.get('/admin/ping', requireAuth, requireAdmin, adminPingController);
router.post('/admin-request', createAdminRequestController);
router.get('/admin/requests', requireAuth, requireAdmin, listAdminRequestsController);
router.post('/admin/requests/:id/approve', requireAuth, requireAdmin, approveAdminRequestController);
router.post('/admin/requests/:id/reject', requireAuth, requireAdmin, rejectAdminRequestController);

export default router;