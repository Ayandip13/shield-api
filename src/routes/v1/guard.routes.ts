import { Router } from 'express';
import {
  getGuards,
  getGuardById,
  createGuard,
  updateGuard,
  updateGuardStatus,
  getGuardMe,
} from '../../controllers/guard.controller';
import shiftRoutes from './shift.routes';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/authorize.middleware';
import { validateObjectId } from '../../middleware/validateObjectId.middleware';

const router = Router();

// Guard self-service profile endpoint
router.get('/me', authenticate, requireRole('guard'), getGuardMe);

// Guard Shift Configuration sub-routes: /api/v1/guards/:guardId/shift
router.use('/:guardId/shift', validateObjectId('guardId'), shiftRoutes);

// Provider Admin endpoints
router.get('/', authenticate, requireRole('provider_admin'), getGuards);
router.post('/', authenticate, requireRole('provider_admin'), createGuard);
router.get('/:id', authenticate, requireRole('provider_admin'), validateObjectId('id'), getGuardById);
router.patch('/:id', authenticate, requireRole('provider_admin'), validateObjectId('id'), updateGuard);
router.patch('/:id/status', authenticate, requireRole('provider_admin'), validateObjectId('id'), updateGuardStatus);

export default router;
