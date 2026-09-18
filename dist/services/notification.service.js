"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const mongoose_1 = require("mongoose");
const notification_model_1 = require("../models/notification.model");
const apiError_1 = require("../utils/apiError");
const logger_1 = require("../utils/logger");
class NotificationService {
    /**
     * Safe helper to create a notification document.
     * Enclosed in try-catch to guarantee that a non-critical notification failure
     * never causes parent business workflows (check-in, entry log, etc.) to throw.
     */
    static async createNotification(payload) {
        try {
            if (!payload.providerId || !payload.type || !payload.title || !payload.message) {
                logger_1.logger.warn('[NotificationService] Missing required fields for notification creation.');
                return;
            }
            await notification_model_1.Notification.create({
                providerId: new mongoose_1.Types.ObjectId(payload.providerId.toString()),
                buildingId: payload.buildingId ? new mongoose_1.Types.ObjectId(payload.buildingId.toString()) : null,
                recipientUserId: payload.recipientUserId ? new mongoose_1.Types.ObjectId(payload.recipientUserId.toString()) : null,
                type: payload.type,
                title: payload.title.trim(),
                message: payload.message.trim(),
                relatedEntityType: payload.relatedEntityType || null,
                relatedEntityId: payload.relatedEntityId ? new mongoose_1.Types.ObjectId(payload.relatedEntityId.toString()) : null,
                isRead: false,
            });
        }
        catch (err) {
            logger_1.logger.warn(`[NotificationService] Non-critical notification creation failed: ${err.message}`);
        }
    }
    /**
     * Build tenant query filter strictly derived from user role
     */
    static getTenantQueryFilter(user) {
        if (user.role === 'guard') {
            return {
                recipientUserId: new mongoose_1.Types.ObjectId(user.id),
            };
        }
        if (user.role === 'committee') {
            if (!user.buildingId) {
                throw apiError_1.ApiError.badRequest('Committee user is not assigned to any building', 'COMMITTEE_NO_BUILDING');
            }
            return {
                buildingId: new mongoose_1.Types.ObjectId(user.buildingId.toString()),
            };
        }
        if (user.role === 'provider_admin') {
            return {
                providerId: new mongoose_1.Types.ObjectId(user.providerId.toString()),
            };
        }
        throw apiError_1.ApiError.forbidden('Unauthorized role for notification access', 'UNAUTHORIZED_ROLE');
    }
    /**
     * Get paginated notifications for current user/tenant scope
     */
    static async getNotifications(user, page = 1, limit = 20) {
        const baseFilter = this.getTenantQueryFilter(user);
        const safePage = Math.max(1, page);
        const safeLimit = Math.min(100, Math.max(1, limit));
        const skip = (safePage - 1) * safeLimit;
        const [notifications, total, unreadCount] = await Promise.all([
            notification_model_1.Notification.find(baseFilter).sort({ createdAt: -1 }).skip(skip).limit(safeLimit),
            notification_model_1.Notification.countDocuments(baseFilter),
            notification_model_1.Notification.countDocuments({ ...baseFilter, isRead: false }),
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
    static async markAsRead(user, notificationId) {
        if (!mongoose_1.Types.ObjectId.isValid(notificationId)) {
            throw apiError_1.ApiError.badRequest('Invalid notification ID format', 'INVALID_ID');
        }
        const notification = await notification_model_1.Notification.findById(notificationId);
        if (!notification) {
            throw apiError_1.ApiError.notFound('Notification record not found', 'NOTIFICATION_NOT_FOUND');
        }
        // Tenant / Scope verification
        if (user.role === 'guard') {
            if (!notification.recipientUserId || notification.recipientUserId.toString() !== user.id) {
                throw apiError_1.ApiError.forbidden('Access denied. Notification belongs to another user.', 'NOTIFICATION_ACCESS_DENIED');
            }
        }
        else if (user.role === 'committee') {
            if (!user.buildingId || !notification.buildingId || notification.buildingId.toString() !== user.buildingId.toString()) {
                throw apiError_1.ApiError.forbidden('Access denied. Notification belongs to another building.', 'NOTIFICATION_ACCESS_DENIED');
            }
        }
        else if (user.role === 'provider_admin') {
            if (notification.providerId.toString() !== user.providerId.toString()) {
                throw apiError_1.ApiError.forbidden('Access denied. Notification belongs to another provider.', 'NOTIFICATION_ACCESS_DENIED');
            }
        }
        notification.isRead = true;
        await notification.save();
        return notification;
    }
    /**
     * Mark all unread notifications within user's permitted scope as read
     */
    static async markAllAsRead(user) {
        const baseFilter = this.getTenantQueryFilter(user);
        const filter = { ...baseFilter, isRead: false };
        const result = await notification_model_1.Notification.updateMany(filter, { $set: { isRead: true } });
        return { updatedCount: result.modifiedCount };
    }
    /**
     * Get unread notification count
     */
    static async getUnreadCount(user) {
        const baseFilter = this.getTenantQueryFilter(user);
        const unreadCount = await notification_model_1.Notification.countDocuments({ ...baseFilter, isRead: false });
        return { unreadCount };
    }
}
exports.NotificationService = NotificationService;
