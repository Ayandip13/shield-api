"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBuildingAccess = validateBuildingAccess;
const apiError_1 = require("./apiError");
const building_model_1 = require("../models/building.model");
async function validateBuildingAccess(user, targetBuildingId) {
    const targetIdStr = targetBuildingId.toString();
    // Committee and Guard roles are strictly scoped to their assigned buildingId
    if (user.role === 'committee' || user.role === 'guard') {
        const userBuildingIdStr = user.buildingId ? user.buildingId.toString() : '';
        if (userBuildingIdStr !== targetIdStr) {
            throw apiError_1.ApiError.forbidden('Access denied. You can only access resources associated with your assigned building.', 'BUILDING_ACCESS_DENIED');
        }
        return true;
    }
    // Provider admins can access any building belonging to their provider
    if (user.role === 'provider_admin') {
        const building = await building_model_1.Building.findById(targetBuildingId);
        if (!building) {
            throw apiError_1.ApiError.notFound('Building not found.', 'BUILDING_NOT_FOUND');
        }
        if (building.providerId.toString() !== user.providerId.toString()) {
            throw apiError_1.ApiError.forbidden('Access denied. This building does not belong to your security provider.', 'PROVIDER_ACCESS_DENIED');
        }
        return true;
    }
    throw apiError_1.ApiError.forbidden('Unauthorized access.', 'ACCESS_DENIED');
}
