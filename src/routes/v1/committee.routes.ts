import { Router } from 'express';
import {
  getCommitteeMembers,
  getCommitteeMemberById,
  createCommitteeMember,
  updateCommitteeMember,
  updateCommitteeStatus,
  getCommitteeMe,
} from '../../controllers/committee.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/authorize.middleware';

const router = Router();

// Committee self-service profile endpoint
router.get('/me', authenticate, requireRole('committee'), getCommitteeMe);

// Provider Admin endpoints
router.get('/', authenticate, requireRole('provider_admin'), getCommitteeMembers);
router.post('/', authenticate, requireRole('provider_admin'), createCommitteeMember);
router.get('/:id', authenticate, requireRole('provider_admin'), getCommitteeMemberById);
router.patch('/:id', authenticate, requireRole('provider_admin'), updateCommitteeMember);
router.patch('/:id/status', authenticate, requireRole('provider_admin'), updateCommitteeStatus);

export default router;
