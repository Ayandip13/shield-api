"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShiftService = void 0;
const mongoose_1 = require("mongoose");
const shift_model_1 = require("../models/shift.model");
const user_model_1 = require("../models/user.model");
const building_model_1 = require("../models/building.model");
const apiError_1 = require("../utils/apiError");
const date_util_1 = require("../utils/date.util");
class ShiftService {
    /**
     * Helper to verify guard exists and belongs to the provider
     */
    static async getGuardAndVerifyOwnership(guardId, providerId) {
        if (!mongoose_1.Types.ObjectId.isValid(guardId)) {
            throw apiError_1.ApiError.badRequest('Invalid guard ID format', 'INVALID_ID');
        }
        const guard = await user_model_1.User.findOne({ _id: guardId, role: 'guard' });
        if (!guard) {
            throw apiError_1.ApiError.notFound('Guard record not found', 'GUARD_NOT_FOUND');
        }
        if (guard.providerId.toString() !== providerId.toString()) {
            throw apiError_1.ApiError.forbidden('Access denied. Guard does not belong to your provider.', 'PROVIDER_ACCESS_DENIED');
        }
        if (!guard.buildingId) {
            throw apiError_1.ApiError.badRequest('Guard is not assigned to any building', 'GUARD_NO_BUILDING');
        }
        return guard;
    }
    /**
     * Get guard's default shift configuration
     */
    static async getGuardShift(guardId, providerId) {
        if (!mongoose_1.Types.ObjectId.isValid(guardId)) {
            throw apiError_1.ApiError.badRequest('Invalid guard ID format', 'INVALID_ID');
        }
        const guard = await user_model_1.User.findOne({ _id: guardId, role: 'guard' }).populate('buildingId', 'name address');
        if (!guard) {
            throw apiError_1.ApiError.notFound('Guard record not found', 'GUARD_NOT_FOUND');
        }
        if (providerId && guard.providerId.toString() !== providerId.toString()) {
            throw apiError_1.ApiError.forbidden('Access denied. Guard does not belong to your provider.', 'PROVIDER_ACCESS_DENIED');
        }
        const existingShift = await shift_model_1.Shift.findOne({ guardId: new mongoose_1.Types.ObjectId(guardId) });
        if (existingShift) {
            return existingShift;
        }
        // Return default shift structure if not yet custom configured
        return {
            guardId: guard._id,
            buildingId: guard.buildingId,
            providerId: guard.providerId,
            startTime: '08:00',
            endTime: '20:00',
            isActive: true,
            isDefaultFallback: true,
        };
    }
    /**
     * Upsert guard's default shift schedule (Provider Admin only)
     */
    static async updateGuardShift(guardId, providerId, startTime, endTime) {
        const guard = await this.getGuardAndVerifyOwnership(guardId, providerId);
        if (!(0, date_util_1.isValidTimeString)(startTime)) {
            throw apiError_1.ApiError.badRequest('Invalid start time format. Use HH:mm (e.g. 08:00)', 'INVALID_START_TIME');
        }
        if (!(0, date_util_1.isValidTimeString)(endTime)) {
            throw apiError_1.ApiError.badRequest('Invalid end time format. Use HH:mm (e.g. 20:00)', 'INVALID_END_TIME');
        }
        // Verify building belongs to provider
        const building = await building_model_1.Building.findById(guard.buildingId);
        if (!building || building.providerId.toString() !== providerId.toString()) {
            throw apiError_1.ApiError.forbidden('Guard assigned building does not belong to provider', 'BUILDING_MISMATCH');
        }
        const shift = await shift_model_1.Shift.findOneAndUpdate({ guardId: guard._id }, {
            guardId: guard._id,
            buildingId: guard.buildingId,
            providerId: guard.providerId,
            startTime: startTime.trim(),
            endTime: endTime.trim(),
            isActive: true,
        }, { upsert: true, new: true, runValidators: true });
        return shift;
    }
}
exports.ShiftService = ShiftService;
