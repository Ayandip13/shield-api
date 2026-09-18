import { Router } from 'express';
import { getDashboard, getGuardDashboard, getActivityStream } from '../../controllers/dashboard.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/authorize.middleware';

const router = Router();

// Require authentication for all dashboard routes
router.use(authenticate);

// Role-specific dashboard endpoints
router.get('/', requireRole('provider_admin', 'committee'), getDashboard);
router.get('/guard', requireRole('guard', 'provider_admin'), getGuardDashboard);
router.get('/activity', requireRole('provider_admin', 'committee'), getActivityStream);

export default router;
