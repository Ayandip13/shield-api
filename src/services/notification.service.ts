import { Types } from 'mongoose';
import { Notification, INotification, NotificationType } from '../models/notification.model';
import { AuthUser } from '../types/express';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';

export interface CreateNotificationPayload {
  providerId: string | Types.ObjectId;
  buildingId?: string | Types.ObjectId | null;
  recipientUserId?: string | Types.ObjectId | null;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: string | Types.ObjectId;
}

export class NotificationService {
  /**
   * Safe helper to create a notification document.
   * Enclosed in try-catch to guarantee that a non-critical notification failure
   * never causes parent business workflows (check-in, entry log, etc.) to throw.
   */
  static async createNotification(payload: CreateNotificationPayload): Promise<void> {
    try {
      if (!payload.providerId || !payload.type || !payload.title || !payload.message) {
        logger.warn('[NotificationService] Missing required fields for notification creation.');
        return;
      }

      await Notification.create({
        providerId: new Types.ObjectId(payload.providerId.toString()),
        buildingId: payload.buildingId ? new Types.ObjectId(payload.buildingId.toString()) : null,
        recipientUserId: payload.recipientUserId ? new Types.ObjectId(payload.recipientUserId.toString()) : null,
        type: payload.type,
        title: payload.title.trim(),
        message: payload.message.trim(),
        relatedEntityType: payload.relatedEntityType || null,
        relatedEntityId: payload.relatedEntityId ? new Types.ObjectId(payload.relatedEntityId.toString()) : null,
        isRead: false,
      });
    } catch (err: any) {
      logger.warn(`[NotificationService] Non-critical notification creation failed: ${err.message}`);
    }
  }

  /**
   * Build tenant query filter strictly derived from user role
   */
  private static getTenantQueryFilter(user: AuthUser): any {
    if (user.role === 'guard') {
      return {
        recipientUserId: new Types.ObjectId(user.id),
      };
    }

    if (user.role === 'committee') {
      if (!user.buildingId) {
        throw ApiError.badRequest('Committee user is not assigned to any building', 'COMMITTEE_NO_BUILDING');
      }
      return {
        buildingId: new Types.ObjectId(user.buildingId.toString()),
      };
    }

    if (user.role === 'provider_admin') {
      return {
        providerId: new Types.ObjectId(user.providerId.toString()),
      };
    }

    throw ApiError.forbidden('Unauthorized role for notification access', 'UNAUTHORIZED_ROLE');
  }

  /**
   * Get paginated notifications for current user/tenant scope
   */
  static async getNotifications(user: AuthUser, page = 1, limit = 20) {
    const baseFilter = this.getTenantQueryFilter(user);

    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const skip = (safePage - 1) * safeLimit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(baseFilter).sort({ createdAt: -1 }).skip(skip).limit(safeLimit),
      Notification.countDocuments(baseFilter),
      Notification.countDocuments({ ...baseFilter, isRead: false }),
    ]);

    const totalPages = Math.ceil(total / safeLimit) || 1;

    return {
      notifications,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages,
      },
      unreadCount,
    };
  }

  /**
   * Mark a single notification as read with tenant security verification
   */
  static async markAsRead(user: AuthUser, notificationId: string): Promise<INotification> {
    if (!Types.ObjectId.isValid(notificationId)) {
      throw ApiError.badRequest('Invalid notification ID format', 'INVALID_ID');
    }

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      throw ApiError.notFound('Notification record not found', 'NOTIFICATION_NOT_FOUND');
    }

    // Tenant / Scope verification
    if (user.role === 'guard') {
      if (!notification.recipientUserId || notification.recipientUserId.toString() !== user.id) {
        throw ApiError.forbidden('Access denied. Notification belongs to another user.', 'NOTIFICATION_ACCESS_DENIED');
      }
    } else if (user.role === 'committee') {
      if (!user.buildingId || !notification.buildingId || notification.buildingId.toString() !== user.buildingId.toString()) {
        throw ApiError.forbidden('Access denied. Notification belongs to another building.', 'NOTIFICATION_ACCESS_DENIED');
      }
    } else if (user.role === 'provider_admin') {
      if (notification.providerId.toString() !== user.providerId.toString()) {
        throw ApiError.forbidden('Access denied. Notification belongs to another provider.', 'NOTIFICATION_ACCESS_DENIED');
      }
    }

    notification.isRead = true;
    await notification.save();
    return notification;
  }

  /**
   * Mark all unread notifications within user's permitted scope as read
   */
  static async markAllAsRead(user: AuthUser): Promise<{ updatedCount: number }> {
    const baseFilter = this.getTenantQueryFilter(user);
    const filter = { ...baseFilter, isRead: false };

    const result = await Notification.updateMany(filter, { $set: { isRead: true } });
    return { updatedCount: result.modifiedCount };
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(user: AuthUser): Promise<{ unreadCount: number }> {
    const baseFilter = this.getTenantQueryFilter(user);
    const unreadCount = await Notification.countDocuments({ ...baseFilter, isRead: false });
    return { unreadCount };
  }
}
