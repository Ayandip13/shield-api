"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuardService = void 0;
const mongoose_1 = require("mongoose");
const user_model_1 = require("../models/user.model");
const building_model_1 = require("../models/building.model");
const apiError_1 = require("../utils/apiError");
class GuardService {
    /**
     * Helper to verify if a building belongs to the provider
     */
    static async verifyBuildingOwnership(buildingId, providerId) {
        if (!mongoose_1.Types.ObjectId.isValid(buildingId)) {
            throw apiError_1.ApiError.badRequest('Invalid building ID format', 'INVALID_ID');
        }
        const building = await building_model_1.Building.findById(buildingId);
        if (!building) {
            throw apiError_1.ApiError.notFound('Assigned building record not found', 'BUILDING_NOT_FOUND');
        }
        if (building.providerId.toString() !== providerId.toString()) {
            throw apiError_1.ApiError.forbidden('Access denied. Building does not belong to your security provider.', 'PROVIDER_ACCESS_DENIED');
        }
    }
    /**
     * List all guards for a provider with optional building filter
     */
    static async getGuards(providerId, buildingId) {
        if (!mongoose_1.Types.ObjectId.isValid(providerId)) {
            throw apiError_1.ApiError.badRequest('Invalid provider ID format', 'INVALID_ID');
        }
        const query = {
            role: 'guard',
            providerId: new mongoose_1.Types.ObjectId(providerId),
        };
        if (buildingId) {
            await this.verifyBuildingOwnership(buildingId, providerId);
            query.buildingId = new mongoose_1.Types.ObjectId(buildingId);
        }
        return user_model_1.User.find(query)
            .populate('buildingId', 'name address contactPhone contactEmail')
            .sort({ createdAt: -1 });
    }
    /**
     * Get a single guard by ID with tenant security check
     */
    static async getGuardById(guardId, providerId) {
        if (!mongoose_1.Types.ObjectId.isValid(guardId)) {
            throw apiError_1.ApiError.badRequest('Invalid guard ID format', 'INVALID_ID');
        }
        const guard = await user_model_1.User.findOne({ _id: guardId, role: 'guard' }).populate('buildingId', 'name address contactPhone contactEmail');
        if (!guard) {
            throw apiError_1.ApiError.notFound('Guard record not found', 'GUARD_NOT_FOUND');
        }
        if (guard.providerId.toString() !== providerId.toString()) {
            throw apiError_1.ApiError.forbidden('Access denied. Guard does not belong to your security provider.', 'PROVIDER_ACCESS_DENIED');
        }
        return guard;
    }
    /**
     * Create a new Guard user
     */
    static async createGuard(providerId, dto) {
        await this.verifyBuildingOwnership(dto.buildingId, providerId);
        const existingUser = await user_model_1.User.findOne({ email: dto.email.toLowerCase() });
        if (existingUser) {
            throw apiError_1.ApiError.badRequest('A user with this email address already exists.', 'DUPLICATE_EMAIL');
        }
        const guard = await user_model_1.User.create({
            name: dto.name,
            email: dto.email.toLowerCase(),
            phone: dto.phone || undefined,
            passwordHash: dto.password,
            role: 'guard',
            providerId: new mongoose_1.Types.ObjectId(providerId),
            buildingId: new mongoose_1.Types.ObjectId(dto.buildingId),
            employeeId: dto.employeeId || undefined,
            joiningDate: dto.joiningDate ? new Date(dto.joiningDate) : undefined,
            monthlySalary: dto.monthlySalary !== undefined ? dto.monthlySalary : undefined,
            designation: dto.designation || undefined,
            isActive: true,
        });
        const populatedGuard = await user_model_1.User.findById(guard._id).populate('buildingId', 'name address contactPhone contactEmail');
        return populatedGuard;
    }
    /**
     * Update guard details
     */
    static async updateGuard(guardId, providerId, dto) {
        const guard = await this.getGuardById(guardId, providerId);
        if (dto.buildingId) {
            await this.verifyBuildingOwnership(dto.buildingId, providerId);
            guard.buildingId = new mongoose_1.Types.ObjectId(dto.buildingId);
        }
        if (dto.name !== undefined)
            guard.name = dto.name;
        if (dto.phone !== undefined)
            guard.phone = dto.phone;
        if (dto.employeeId !== undefined)
            guard.employeeId = dto.employeeId;
        if (dto.joiningDate !== undefined) {
            guard.joiningDate = dto.joiningDate ? new Date(dto.joiningDate) : undefined;
        }
        if (dto.monthlySalary !== undefined)
            guard.monthlySalary = dto.monthlySalary;
        if (dto.designation !== undefined)
            guard.designation = dto.designation;
        await guard.save();
        return (await user_model_1.User.findById(guard._id).populate('buildingId', 'name address contactPhone contactEmail'));
    }
    /**
     * Update guard status (soft activate/deactivate)
     */
    static async updateGuardStatus(guardId, providerId, isActive) {
        const guard = await this.getGuardById(guardId, providerId);
        guard.isActive = isActive;
        await guard.save();
        return guard;
    }
    /**
     * Get authenticated guard's own profile and assigned building details
     */
    static async getGuardMe(userId) {
        const guard = await user_model_1.User.findOne({ _id: userId, role: 'guard' }).populate('buildingId', 'name address contactPhone contactEmail');
        if (!guard) {
            throw apiError_1.ApiError.notFound('Guard profile not found', 'GUARD_NOT_FOUND');
        }
        return guard;
    }
}
exports.GuardService = GuardService;
