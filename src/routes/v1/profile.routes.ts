import { Router } from 'express';
import { getProfile, updateProfile, changePassword } from '../../controllers/profile.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

// Require authentication for all profile routes
router.use(authenticate);

router.get('/', getProfile);
router.patch('/', updateProfile);
router.patch('/password', changePassword);

export default router;
