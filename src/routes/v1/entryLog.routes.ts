import { Router } from 'express';
import {
  createEntryLog,
  markEntryExit,
  getActiveEntries,
  getEntryLogs,
  getEntryLogById,
} from '../../controllers/entryLog.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/authorize.middleware';
import { validateObjectId } from '../../middleware/validateObjectId.middleware';

const router = Router();

// Active entries (Currently inside)
router.get('/active', authenticate, requireRole('guard', 'committee', 'provider_admin'), getActiveEntries);

// Historical entry logs list
router.get('/', authenticate, requireRole('guard', 'committee', 'provider_admin'), getEntryLogs);

// Single entry log detail
router.get('/:id', authenticate, requireRole('guard', 'committee', 'provider_admin'), validateObjectId('id'), getEntryLogById);

// Guard creates entry log
router.post('/', authenticate, requireRole('guard'), createEntryLog);

// Guard marks entry exit
router.patch('/:id/exit', authenticate, requireRole('guard'), validateObjectId('id'), markEntryExit);

export default router;
