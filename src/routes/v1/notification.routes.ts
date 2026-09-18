import { Router } from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
} from '../../controllers/notification.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validateObjectId } from '../../middleware/validateObjectId.middleware';

const router = Router();

// Protect all notification endpoints for authenticated users
router.use(authenticate);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', validateObjectId('id'), markAsRead);

export default router;
