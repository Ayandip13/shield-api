import { Router } from 'express';
import { login, refresh, logout, logoutAll, getMe } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Public auth routes
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);

// Protected auth routes
router.post('/logout-all', authenticate, logoutAll);
router.get('/me', authenticate, getMe);

export default router;
