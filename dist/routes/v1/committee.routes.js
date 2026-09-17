"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const committee_controller_1 = require("../../controllers/committee.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const authorize_middleware_1 = require("../../middleware/authorize.middleware");
const router = (0, express_1.Router)();
// Committee self-service profile endpoint
router.get('/me', auth_middleware_1.authenticate, (0, authorize_middleware_1.requireRole)('committee'), committee_controller_1.getCommitteeMe);
// Provider Admin endpoints
router.get('/', auth_middleware_1.authenticate, (0, authorize_middleware_1.requireRole)('provider_admin'), committee_controller_1.getCommitteeMembers);
router.post('/', auth_middleware_1.authenticate, (0, authorize_middleware_1.requireRole)('provider_admin'), committee_controller_1.createCommitteeMember);
router.get('/:id', auth_middleware_1.authenticate, (0, authorize_middleware_1.requireRole)('provider_admin'), committee_controller_1.getCommitteeMemberById);
router.patch('/:id', auth_middleware_1.authenticate, (0, authorize_middleware_1.requireRole)('provider_admin'), committee_controller_1.updateCommitteeMember);
router.patch('/:id/status', auth_middleware_1.authenticate, (0, authorize_middleware_1.requireRole)('provider_admin'), committee_controller_1.updateCommitteeStatus);
exports.default = router;
