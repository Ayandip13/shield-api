import { Router } from 'express';
import { getGuardShift, updateGuardShift } from '../../controllers/shift.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/authorize.middleware';

const router = Router({ mergeParams: true });

router.get('/', authenticate, requireRole('provider_admin', 'guard'), getGuardShift);
router.put('/', authenticate, requireRole('provider_admin'), updateGuardShift);

export default router;
