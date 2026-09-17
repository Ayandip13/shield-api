"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommitteeService = void 0;
const mongoose_1 = require("mongoose");
const user_model_1 = require("../models/user.model");
const building_model_1 = require("../models/building.model");
const apiError_1 = require("../utils/apiError");
class CommitteeService {
    /**
     * Helper to verify building ownership for provider
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
     * List committee members for provider
     */
    static async getCommitteeMembers(providerId, buildingId) {
        if (!mongoose_1.Types.ObjectId.isValid(providerId)) {
            throw apiError_1.ApiError.badRequest('Invalid provider ID format', 'INVALID_ID');
        }
        const query = {
            role: 'committee',
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
     * Get single committee member by ID
     */
    static async getCommitteeMemberById(memberId, providerId) {
        if (!mongoose_1.Types.ObjectId.isValid(memberId)) {
            throw apiError_1.ApiError.badRequest('Invalid committee member ID format', 'INVALID_ID');
        }
        const member = await user_model_1.User.findOne({ _id: memberId, role: 'committee' }).populate('buildingId', 'name address contactPhone contactEmail');
        if (!member) {
            throw apiError_1.ApiError.notFound('Committee member record not found', 'MEMBER_NOT_FOUND');
        }
        if (member.providerId.toString() !== providerId.toString()) {
            throw apiError_1.ApiError.forbidden('Access denied. Committee member does not belong to your security provider.', 'PROVIDER_ACCESS_DENIED');
        }
        return member;
    }
    /**
     * Create committee member account
     */
    static async createCommitteeMember(providerId, dto) {
        await this.verifyBuildingOwnership(dto.buildingId, providerId);
        const existingUser = await user_model_1.User.findOne({ email: dto.email.toLowerCase() });
        if (existingUser) {
            throw apiError_1.ApiError.badRequest('A user with this email address already exists.', 'DUPLICATE_EMAIL');
        }
        const member = await user_model_1.User.create({
            name: dto.name,
            email: dto.email.toLowerCase(),
            phone: dto.phone || undefined,
            passwordHash: dto.password,
            role: 'committee',
            providerId: new mongoose_1.Types.ObjectId(providerId),
            buildingId: new mongoose_1.Types.ObjectId(dto.buildingId),
            isActive: true,
        });
        const populatedMember = await user_model_1.User.findById(member._id).populate('buildingId', 'name address contactPhone contactEmail');
        return populatedMember;
    }
    /**
     * Update committee member details
     */
    static async updateCommitteeMember(memberId, providerId, dto) {
        const member = await this.getCommitteeMemberById(memberId, providerId);
        if (dto.buildingId) {
            await this.verifyBuildingOwnership(dto.buildingId, providerId);
            member.buildingId = new mongoose_1.Types.ObjectId(dto.buildingId);
        }
        if (dto.name !== undefined)
            member.name = dto.name;
        if (dto.phone !== undefined)
            member.phone = dto.phone;
        await member.save();
        return (await user_model_1.User.findById(member._id).populate('buildingId', 'name address contactPhone contactEmail'));
    }
    /**
     * Update committee member status
     */
    static async updateCommitteeStatus(memberId, providerId, isActive) {
        const member = await this.getCommitteeMemberById(memberId, providerId);
        member.isActive = isActive;
        await member.save();
        return member;
    }
    /**
     * Get authenticated committee user's own profile and building information
     */
    static async getCommitteeMe(userId) {
        const member = await user_model_1.User.findOne({ _id: userId, role: 'committee' }).populate('buildingId', 'name address contactPhone contactEmail');
        if (!member) {
            throw apiError_1.ApiError.notFound('Committee member profile not found', 'MEMBER_NOT_FOUND');
        }
        return member;
    }
}
exports.CommitteeService = CommitteeService;
