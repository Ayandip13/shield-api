"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const attendance_controller_1 = require("../../controllers/attendance.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const authorize_middleware_1 = require("../../middleware/authorize.middleware");
const router = (0, express_1.Router)();
// Guard attendance endpoints
router.post('/check-in', auth_middleware_1.authenticate, (0, authorize_middleware_1.requireRole)('guard'), attendance_controller_1.checkInGuard);
router.post('/check-out', auth_middleware_1.authenticate, (0, authorize_middleware_1.requireRole)('guard'), attendance_controller_1.checkOutGuard);
router.get('/me', auth_middleware_1.authenticate, (0, authorize_middleware_1.requireRole)('guard'), attendance_controller_1.getGuardAttendanceHistory);
router.get('/me/today', auth_middleware_1.authenticate, (0, authorize_middleware_1.requireRole)('guard'), attendance_controller_1.getGuardTodayStatus);
// Provider Admin overview endpoint
router.get('/', auth_middleware_1.authenticate, (0, authorize_middleware_1.requireRole)('provider_admin'), attendance_controller_1.getProviderAttendance);
// Committee building endpoint
router.get('/building', auth_middleware_1.authenticate, (0, authorize_middleware_1.requireRole)('committee'), attendance_controller_1.getCommitteeAttendance);
exports.default = router;
