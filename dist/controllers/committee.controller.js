"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommitteeMembers = getCommitteeMembers;
exports.getCommitteeMemberById = getCommitteeMemberById;
exports.createCommitteeMember = createCommitteeMember;
exports.updateCommitteeMember = updateCommitteeMember;
exports.updateCommitteeStatus = updateCommitteeStatus;
exports.getCommitteeMe = getCommitteeMe;
const committee_service_1 = require("../services/committee.service");
const refreshToken_model_1 = require("../models/refreshToken.model");
const apiResponse_1 = require("../utils/apiResponse");
const apiError_1 = require("../utils/apiError");
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+0-9\s\-()]{5,20}$/;
async function getCommitteeMembers(req, res, next) {
    try {
        const providerId = req.user.providerId.toString();
        const buildingId = req.query.buildingId ? req.query.buildingId : undefined;
        const members = await committee_service_1.CommitteeService.getCommitteeMembers(providerId, buildingId);
        apiResponse_1.ApiResponse.success(res, 200, 'Committee members list retrieved successfully', members);
    }
    catch (error) {
        next(error);
    }
}
async function getCommitteeMemberById(req, res, next) {
    try {
        const id = req.params.id;
        const providerId = req.user.providerId.toString();
        const member = await committee_service_1.CommitteeService.getCommitteeMemberById(id, providerId);
        apiResponse_1.ApiResponse.success(res, 200, 'Committee member retrieved successfully', member);
    }
    catch (error) {
        next(error);
    }
}
async function createCommitteeMember(req, res, next) {
    try {
        const providerId = req.user.providerId.toString();
        const { name, email, phone, password, buildingId } = req.body;
        if (!name || typeof name !== 'string' || !name.trim()) {
            throw apiError_1.ApiError.badRequest('Committee member name is required', 'MISSING_NAME');
        }
        if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim().toLowerCase())) {
            throw apiError_1.ApiError.badRequest('Valid email address is required', 'INVALID_EMAIL');
        }
        if (!password || typeof password !== 'string' || password.length < 6) {
            throw apiError_1.ApiError.badRequest('Password is required and must be at least 6 characters', 'INVALID_PASSWORD');
        }
        if (!buildingId || typeof buildingId !== 'string') {
            throw apiError_1.ApiError.badRequest('Target buildingId is required', 'MISSING_BUILDING');
        }
        if (phone && (typeof phone !== 'string' || !PHONE_REGEX.test(phone.trim()))) {
            throw apiError_1.ApiError.badRequest('Invalid phone format', 'INVALID_PHONE');
        }
        const member = await committee_service_1.CommitteeService.createCommitteeMember(providerId, {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone ? phone.trim() : undefined,
            password,
            buildingId,
        });
        apiResponse_1.ApiResponse.success(res, 201, 'Committee member created successfully', member);
    }
    catch (error) {
        next(error);
    }
}
async function updateCommitteeMember(req, res, next) {
    try {
        const id = req.params.id;
        const providerId = req.user.providerId.toString();
        const { name, phone, buildingId } = req.body;
        if (req.body.role || req.body.providerId || req.body.password || req.body.passwordHash) {
            throw apiError_1.ApiError.badRequest('Updating role, providerId, or password via this route is prohibited', 'RESTRICTED_FIELD');
        }
        if (name !== undefined && (!name || typeof name !== 'string' || !name.trim())) {
            throw apiError_1.ApiError.badRequest('Committee member name cannot be empty', 'INVALID_NAME');
        }
        if (phone !== undefined && phone !== null && phone !== '') {
            if (typeof phone !== 'string' || !PHONE_REGEX.test(phone.trim())) {
                throw apiError_1.ApiError.badRequest('Invalid phone format', 'INVALID_PHONE');
            }
        }
        const updatedMember = await committee_service_1.CommitteeService.updateCommitteeMember(id, providerId, {
            name: name ? name.trim() : undefined,
            phone: phone !== undefined ? (phone ? phone.trim() : '') : undefined,
            buildingId: buildingId ? String(buildingId) : undefined,
        });
        apiResponse_1.ApiResponse.success(res, 200, 'Committee member updated successfully', updatedMember);
    }
    catch (error) {
        next(error);
    }
}
async function updateCommitteeStatus(req, res, next) {
    try {
        const id = req.params.id;
        const providerId = req.user.providerId.toString();
        const { isActive } = req.body;
        if (typeof isActive !== 'boolean') {
            throw apiError_1.ApiError.badRequest('isActive must be a boolean value', 'INVALID_STATUS');
        }
        const member = await committee_service_1.CommitteeService.updateCommitteeStatus(id, providerId, isActive);
        if (!isActive) {
            await refreshToken_model_1.RefreshToken.updateMany({ userId: id, revokedAt: null }, { revokedAt: new Date() });
        }
        apiResponse_1.ApiResponse.success(res, 200, `Committee member status updated to ${isActive ? 'active' : 'inactive'}`, member);
    }
    catch (error) {
        next(error);
    }
}
async function getCommitteeMe(req, res, next) {
    try {
        const userId = req.user.id;
        const memberProfile = await committee_service_1.CommitteeService.getCommitteeMe(userId);
        apiResponse_1.ApiResponse.success(res, 200, 'Committee member profile retrieved successfully', memberProfile);
    }
    catch (error) {
        next(error);
    }
}
