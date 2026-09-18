"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotifications = getNotifications;
exports.markAsRead = markAsRead;
exports.markAllAsRead = markAllAsRead;
exports.getUnreadCount = getUnreadCount;
const notification_service_1 = require("../services/notification.service");
const apiResponse_1 = require("../utils/apiResponse");
async function getNotifications(req, res, next) {
    try {
        const page = req.query.page ? parseInt(req.query.page, 10) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
        const result = await notification_service_1.NotificationService.getNotifications(req.user, page, limit);
        apiResponse_1.ApiResponse.success(res, 200, 'Notifications retrieved successfully', result);
    }
    catch (error) {
        next(error);
    }
}
async function markAsRead(req, res, next) {
    try {
        const notificationId = req.params.id;
        const updatedNotification = await notification_service_1.NotificationService.markAsRead(req.user, notificationId);
        apiResponse_1.ApiResponse.success(res, 200, 'Notification marked as read', updatedNotification);
    }
    catch (error) {
        next(error);
    }
}
async function markAllAsRead(req, res, next) {
    try {
        const result = await notification_service_1.NotificationService.markAllAsRead(req.user);
        apiResponse_1.ApiResponse.success(res, 200, 'All notifications marked as read', result);
    }
    catch (error) {
        next(error);
    }
}
async function getUnreadCount(req, res, next) {
    try {
        const result = await notification_service_1.NotificationService.getUnreadCount(req.user);
        apiResponse_1.ApiResponse.success(res, 200, 'Unread count retrieved successfully', result);
    }
    catch (error) {
        next(error);
    }
}
