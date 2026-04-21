import { Router } from 'express';
import { getAllUsers, getUserById, createUser, updateUser, deleteUser, totalUser } from '../controllers/UserController';
import { requireAdmin, requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Routes sensibles: on exige auth + admin
router.get('/', requireAuth, requireAdmin, getAllUsers);
// définir /total avant /:id pour éviter que "total" soit interprété comme un id
router.get('/total', requireAuth, requireAdmin, totalUser);
router.get('/:id', requireAuth, requireAdmin, getUserById);
router.post('/', requireAuth, requireAdmin, createUser);
router.put('/:id', requireAuth, requireAdmin, updateUser);
router.delete('/:id', requireAuth, requireAdmin, deleteUser);

export default router;
