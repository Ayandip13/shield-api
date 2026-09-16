import { Router } from 'express';
import { login, getMe } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/login', login);

// Protected routes
router.get('/me', authenticate, getMe);

export default router;
