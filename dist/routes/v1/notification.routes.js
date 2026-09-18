"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_controller_1 = require("../../controllers/notification.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const validateObjectId_middleware_1 = require("../../middleware/validateObjectId.middleware");
const router = (0, express_1.Router)();
// Protect all notification endpoints for authenticated users
router.use(auth_middleware_1.authenticate);
router.get('/', notification_controller_1.getNotifications);
router.get('/unread-count', notification_controller_1.getUnreadCount);
router.patch('/read-all', notification_controller_1.markAllAsRead);
router.patch('/:id/read', (0, validateObjectId_middleware_1.validateObjectId)('id'), notification_controller_1.markAsRead);
exports.default = router;
