"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGuardShift = getGuardShift;
exports.updateGuardShift = updateGuardShift;
const shift_service_1 = require("../services/shift.service");
const apiResponse_1 = require("../utils/apiResponse");
const apiError_1 = require("../utils/apiError");
async function getGuardShift(req, res, next) {
    try {
        const targetGuardId = req.params.guardId;
        if (req.user.role === 'guard') {
            // Guard can only inspect their own shift
            if (req.user.id !== targetGuardId) {
                throw apiError_1.ApiError.forbidden('Guards can only view their own shift schedule', 'FORBIDDEN_ACCESS');
            }
            const shift = await shift_service_1.ShiftService.getGuardShift(targetGuardId);
            apiResponse_1.ApiResponse.success(res, 200, 'Shift retrieved successfully', shift);
            return;
        }
        if (req.user.role === 'provider_admin') {
            const providerId = req.user.providerId.toString();
            const shift = await shift_service_1.ShiftService.getGuardShift(targetGuardId, providerId);
            apiResponse_1.ApiResponse.success(res, 200, 'Guard shift retrieved successfully', shift);
            return;
        }
        throw apiError_1.ApiError.forbidden('Unauthorized to view guard shift', 'FORBIDDEN_ROLE');
    }
    catch (error) {
        next(error);
    }
}
async function updateGuardShift(req, res, next) {
    try {
        const guardId = req.params.guardId;
        const providerId = req.user.providerId.toString();
        const { startTime, endTime } = req.body;
        if (!startTime || !endTime) {
            throw apiError_1.ApiError.badRequest('Both startTime and endTime are required', 'MISSING_SHIFT_TIMES');
        }
        const updatedShift = await shift_service_1.ShiftService.updateGuardShift(guardId, providerId, startTime, endTime);
        apiResponse_1.ApiResponse.success(res, 200, 'Guard shift updated successfully', updatedShift);
    }
    catch (error) {
        next(error);
    }
}
