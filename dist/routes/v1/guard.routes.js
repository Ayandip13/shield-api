"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const guard_controller_1 = require("../../controllers/guard.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const authorize_middleware_1 = require("../../middleware/authorize.middleware");
const router = (0, express_1.Router)();
// Guard self-service profile endpoint
router.get('/me', auth_middleware_1.authenticate, (0, authorize_middleware_1.requireRole)('guard'), guard_controller_1.getGuardMe);
// Provider Admin endpoints
router.get('/', auth_middleware_1.authenticate, (0, authorize_middleware_1.requireRole)('provider_admin'), guard_controller_1.getGuards);
router.post('/', auth_middleware_1.authenticate, (0, authorize_middleware_1.requireRole)('provider_admin'), guard_controller_1.createGuard);
router.get('/:id', auth_middleware_1.authenticate, (0, authorize_middleware_1.requireRole)('provider_admin'), guard_controller_1.getGuardById);
router.patch('/:id', auth_middleware_1.authenticate, (0, authorize_middleware_1.requireRole)('provider_admin'), guard_controller_1.updateGuard);
router.patch('/:id/status', auth_middleware_1.authenticate, (0, authorize_middleware_1.requireRole)('provider_admin'), guard_controller_1.updateGuardStatus);
exports.default = router;
