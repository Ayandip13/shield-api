import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';
import { ApiResponse } from '../utils/apiResponse';

export async function getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

    const result = await NotificationService.getNotifications(req.user!, page, limit);
    ApiResponse.success(res, 200, 'Notifications retrieved successfully', result);
  } catch (error) {
    next(error);
  }
}

export async function markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const notificationId = req.params.id as string;
    const updatedNotification = await NotificationService.markAsRead(req.user!, notificationId);
    ApiResponse.success(res, 200, 'Notification marked as read', updatedNotification);
  } catch (error) {
    next(error);
  }
}

export async function markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await NotificationService.markAllAsRead(req.user!);
    ApiResponse.success(res, 200, 'All notifications marked as read', result);
  } catch (error) {
    next(error);
  }
}

export async function getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await NotificationService.getUnreadCount(req.user!);
    ApiResponse.success(res, 200, 'Unread count retrieved successfully', result);
  } catch (error) {
    next(error);
  }
}
