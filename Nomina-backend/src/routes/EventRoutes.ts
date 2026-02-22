import { Router } from 'express';
import { requireAdmin, requireAuth } from '../middleware/auth.middleware';
import {
  createEvent,
  deleteEvent,
  getEventById,
  getEvents,
  totalEvent,
  updateEvent,
} from '../controllers/EventController';

const router = Router();

router.get('/total', totalEvent);
router.get('/', getEvents);
router.get('/:id', getEventById);
router.post('/', requireAuth, requireAdmin, createEvent);
router.put('/:id', requireAuth, requireAdmin, updateEvent);
router.delete('/:id', requireAuth, requireAdmin, deleteEvent);

export default router;
