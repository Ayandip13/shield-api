"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_controller_1 = require("../../controllers/dashboard.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const authorize_middleware_1 = require("../../middleware/authorize.middleware");
const router = (0, express_1.Router)();
// Require authentication for all dashboard routes
router.use(auth_middleware_1.authenticate);
// Role-specific dashboard endpoints
router.get('/', (0, authorize_middleware_1.requireRole)('provider_admin', 'committee'), dashboard_controller_1.getDashboard);
router.get('/guard', (0, authorize_middleware_1.requireRole)('guard', 'provider_admin'), dashboard_controller_1.getGuardDashboard);
router.get('/activity', (0, authorize_middleware_1.requireRole)('provider_admin', 'committee'), dashboard_controller_1.getActivityStream);
exports.default = router;
