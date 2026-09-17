import { Router } from 'express';
import {
  getGuards,
  getGuardById,
  createGuard,
  updateGuard,
  updateGuardStatus,
  getGuardMe,
} from '../../controllers/guard.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/authorize.middleware';

const router = Router();

// Guard self-service profile endpoint
router.get('/me', authenticate, requireRole('guard'), getGuardMe);

// Provider Admin endpoints
router.get('/', authenticate, requireRole('provider_admin'), getGuards);
router.post('/', authenticate, requireRole('provider_admin'), createGuard);
router.get('/:id', authenticate, requireRole('provider_admin'), getGuardById);
router.patch('/:id', authenticate, requireRole('provider_admin'), updateGuard);
router.patch('/:id/status', authenticate, requireRole('provider_admin'), updateGuardStatus);

export default router;
