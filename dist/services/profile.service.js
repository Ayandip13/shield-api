"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserProfile = getUserProfile;
exports.updateUserProfile = updateUserProfile;
exports.changeUserPassword = changeUserPassword;
const user_model_1 = require("../models/user.model");
const refreshToken_model_1 = require("../models/refreshToken.model");
require("../models/provider.model");
require("../models/building.model");
const apiError_1 = require("../utils/apiError");
async function getUserProfile(userId) {
    const user = await user_model_1.User.findById(userId)
        .populate('providerId', 'name')
        .populate('buildingId', 'name address')
        .lean();
    if (!user || !user.isActive) {
        throw apiError_1.ApiError.unauthorized('User account not found or deactivated.', 'USER_INACTIVE');
    }
    const baseProfile = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone || null,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
    if (user.role === 'guard') {
        const buildingObj = user.buildingId && typeof user.buildingId === 'object' && 'name' in user.buildingId
            ? {
                id: user.buildingId._id.toString(),
                name: user.buildingId.name,
                address: user.buildingId.address,
            }
            : null;
        return {
            ...baseProfile,
            employeeId: user.employeeId || null,
            designation: user.designation || 'Security Guard',
            joiningDate: user.joiningDate || null,
            monthlySalary: user.monthlySalary !== undefined && user.monthlySalary !== null ? user.monthlySalary : null,
            building: buildingObj,
        };
    }
    if (user.role === 'committee') {
        const buildingObj = user.buildingId && typeof user.buildingId === 'object' && 'name' in user.buildingId
            ? {
                id: user.buildingId._id.toString(),
                name: user.buildingId.name,
                address: user.buildingId.address,
            }
            : null;
        return {
            ...baseProfile,
            designation: user.designation || 'Committee Member',
            building: buildingObj,
        };
    }
    if (user.role === 'provider_admin') {
        const providerObj = user.providerId && typeof user.providerId === 'object' && 'name' in user.providerId
            ? {
                id: user.providerId._id.toString(),
                name: user.providerId.name,
            }
            : null;
        return {
            ...baseProfile,
            provider: providerObj,
        };
    }
    return baseProfile;
}
async function updateUserProfile(userId, data) {
    const user = await user_model_1.User.findById(userId);
    if (!user || !user.isActive) {
        throw apiError_1.ApiError.unauthorized('User account not found or deactivated.', 'USER_INACTIVE');
    }
    if (data.name !== undefined) {
        const trimmedName = data.name.trim();
        if (!trimmedName) {
            throw apiError_1.ApiError.badRequest('Name cannot be empty.', 'INVALID_INPUT');
        }
        user.name = trimmedName;
    }
    if (data.phone !== undefined) {
        user.phone = data.phone ? data.phone.trim() : undefined;
    }
    await user.save();
    return getUserProfile(userId);
}
async function changeUserPassword(userId, currentPassword, newPassword) {
    if (!currentPassword || !newPassword) {
        throw apiError_1.ApiError.badRequest('Current password and new password are required.', 'MISSING_FIELDS');
    }
    if (newPassword.length < 8) {
        throw apiError_1.ApiError.badRequest('New password must be at least 8 characters long.', 'WEAK_PASSWORD');
    }
    const user = await user_model_1.User.findById(userId).select('+passwordHash');
    if (!user || !user.isActive) {
        throw apiError_1.ApiError.unauthorized('User account not found or deactivated.', 'USER_INACTIVE');
    }
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
        throw apiError_1.ApiError.badRequest('Current password is incorrect.', 'INVALID_CURRENT_PASSWORD');
    }
    user.passwordHash = newPassword;
    await user.save();
    // Revoke all active refresh sessions for security on password change
    await refreshToken_model_1.RefreshToken.updateMany({ userId: user._id, revokedAt: null }, { revokedAt: new Date() });
    return { message: 'Password changed successfully.' };
}
