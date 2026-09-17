"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const building_controller_1 = require("../../controllers/building.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const authorize_middleware_1 = require("../../middleware/authorize.middleware");
const router = (0, express_1.Router)();
// Protect all building management endpoints for provider_admin role only
router.use(auth_middleware_1.authenticate, (0, authorize_middleware_1.requireRole)('provider_admin'));
router.get('/', building_controller_1.getBuildings);
router.post('/', building_controller_1.createBuilding);
router.get('/:id', building_controller_1.getBuildingById);
router.patch('/:id', building_controller_1.updateBuilding);
router.patch('/:id/status', building_controller_1.updateBuildingStatus);
exports.default = router;
