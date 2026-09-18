"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildingService = void 0;
const mongoose_1 = require("mongoose");
const building_model_1 = require("../models/building.model");
const apiError_1 = require("../utils/apiError");
const notification_service_1 = require("./notification.service");
class BuildingService {
    static async getBuildingsByProvider(providerId, page, limit) {
        if (!mongoose_1.Types.ObjectId.isValid(providerId)) {
            throw apiError_1.ApiError.badRequest('Invalid provider ID format', 'INVALID_ID');
        }
        const query = building_model_1.Building.find({ providerId: new mongoose_1.Types.ObjectId(providerId) }).sort({ createdAt: -1 });
        if (page && limit) {
            const safePage = Math.max(1, page);
            const safeLimit = Math.min(100, Math.max(1, limit));
            query.skip((safePage - 1) * safeLimit).limit(safeLimit);
        }
        return query;
    }
    /**
     * Get a single building with strict tenant isolation check
     */
    static async getBuildingById(buildingId, providerId) {
        if (!mongoose_1.Types.ObjectId.isValid(buildingId)) {
            throw apiError_1.ApiError.badRequest('Invalid building ID format', 'INVALID_ID');
        }
        const building = await building_model_1.Building.findById(buildingId);
        if (!building) {
            throw apiError_1.ApiError.notFound('Building record not found', 'BUILDING_NOT_FOUND');
        }
        // Strict tenant isolation enforcement
        if (building.providerId.toString() !== providerId.toString()) {
            throw apiError_1.ApiError.forbidden('Access denied. Building belongs to another security provider.', 'PROVIDER_ACCESS_DENIED');
        }
        return building;
    }
    /**
     * Create a new building for the authenticated provider
     */
    static async createBuilding(providerId, dto) {
        if (!mongoose_1.Types.ObjectId.isValid(providerId)) {
            throw apiError_1.ApiError.badRequest('Invalid provider ID format', 'INVALID_ID');
        }
        const building = await building_model_1.Building.create({
            providerId: new mongoose_1.Types.ObjectId(providerId),
            name: dto.name,
            address: dto.address,
            contactPhone: dto.contactPhone || undefined,
            contactEmail: dto.contactEmail || undefined,
            isActive: true,
        });
        notification_service_1.NotificationService.createNotification({
            providerId,
            buildingId: building._id,
            type: 'building',
            title: 'Building Created',
            message: `New building '${dto.name}' was registered.`,
            relatedEntityType: 'Building',
            relatedEntityId: building._id,
        });
        return building;
    }
    /**
     * Update building details for the authenticated provider
     */
    static async updateBuilding(buildingId, providerId, dto) {
        const building = await this.getBuildingById(buildingId, providerId);
        if (dto.name !== undefined)
            building.name = dto.name;
        if (dto.address !== undefined)
            building.address = dto.address;
        if (dto.contactPhone !== undefined)
            building.contactPhone = dto.contactPhone;
        if (dto.contactEmail !== undefined)
            building.contactEmail = dto.contactEmail;
        await building.save();
        return building;
    }
    /**
     * Activate or deactivate building status (soft status toggle)
     */
    static async updateBuildingStatus(buildingId, providerId, isActive) {
        const building = await this.getBuildingById(buildingId, providerId);
        building.isActive = isActive;
        await building.save();
        notification_service_1.NotificationService.createNotification({
            providerId,
            buildingId: building._id,
            type: 'building',
            title: 'Building Status Updated',
            message: `Building '${building.name}' status set to ${isActive ? 'active' : 'inactive'}.`,
            relatedEntityType: 'Building',
            relatedEntityId: building._id,
        });
        return building;
    }
}
exports.BuildingService = BuildingService;
