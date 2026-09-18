"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const entryLog_controller_1 = require("../../controllers/entryLog.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const authorize_middleware_1 = require("../../middleware/authorize.middleware");
const router = (0, express_1.Router)();
// Active entries (Currently inside)
router.get('/active', auth_middleware_1.authenticate, (0, authorize_middleware_1.requireRole)('guard', 'committee', 'provider_admin'), entryLog_controller_1.getActiveEntries);
// Historical entry logs list
router.get('/', auth_middleware_1.authenticate, (0, authorize_middleware_1.requireRole)('guard', 'committee', 'provider_admin'), entryLog_controller_1.getEntryLogs);
// Single entry log detail
router.get('/:id', auth_middleware_1.authenticate, (0, authorize_middleware_1.requireRole)('guard', 'committee', 'provider_admin'), entryLog_controller_1.getEntryLogById);
// Guard creates entry log
router.post('/', auth_middleware_1.authenticate, (0, authorize_middleware_1.requireRole)('guard'), entryLog_controller_1.createEntryLog);
// Guard marks entry exit
router.patch('/:id/exit', auth_middleware_1.authenticate, (0, authorize_middleware_1.requireRole)('guard'), entryLog_controller_1.markEntryExit);
exports.default = router;
