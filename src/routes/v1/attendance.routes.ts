import { Router } from 'express';
import {
  checkInGuard,
  checkOutGuard,
  getGuardAttendanceHistory,
  getGuardTodayStatus,
  getProviderAttendance,
  getCommitteeAttendance,
} from '../../controllers/attendance.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/authorize.middleware';

const router = Router();

// Guard attendance endpoints
router.post('/check-in', authenticate, requireRole('guard'), checkInGuard);
router.post('/check-out', authenticate, requireRole('guard'), checkOutGuard);
router.get('/me', authenticate, requireRole('guard'), getGuardAttendanceHistory);
router.get('/me/today', authenticate, requireRole('guard'), getGuardTodayStatus);

// Provider Admin overview endpoint
router.get('/', authenticate, requireRole('provider_admin'), getProviderAttendance);

// Committee building endpoint
router.get('/building', authenticate, requireRole('committee'), getCommitteeAttendance);

export default router;
