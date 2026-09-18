"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntryLogService = void 0;
const mongoose_1 = require("mongoose");
const entryLog_model_1 = require("../models/entryLog.model");
const user_model_1 = require("../models/user.model");
const building_model_1 = require("../models/building.model");
const apiError_1 = require("../utils/apiError");
class EntryLogService {
    /**
     * Helper to verify active guard status and building assignment
     */
    static async verifyActiveGuard(guardUserId) {
        if (!mongoose_1.Types.ObjectId.isValid(guardUserId)) {
            throw apiError_1.ApiError.badRequest('Invalid guard ID format', 'INVALID_ID');
        }
        const guard = await user_model_1.User.findById(guardUserId);
        if (!guard || guard.role !== 'guard') {
            throw apiError_1.ApiError.notFound('Guard record not found', 'GUARD_NOT_FOUND');
        }
        if (!guard.isActive) {
            throw apiError_1.ApiError.forbidden('Inactive guard account. Entry logging disabled.', 'GUARD_INACTIVE');
        }
        if (!guard.buildingId) {
            throw apiError_1.ApiError.badRequest('Guard is not assigned to any building', 'GUARD_NO_BUILDING');
        }
        return guard;
    }
    /**
     * Guard creates new Entry Log
     */
    static async createEntry(guardUserId, dto) {
        const guard = await this.verifyActiveGuard(guardUserId);
        if (!dto.personName || typeof dto.personName !== 'string' || !dto.personName.trim()) {
            throw apiError_1.ApiError.badRequest('Person name is required', 'MISSING_PERSON_NAME');
        }
        const validTypes = ['visitor', 'delivery', 'staff', 'other'];
        if (!dto.personType || !validTypes.includes(dto.personType)) {
            throw apiError_1.ApiError.badRequest('Valid personType is required (visitor, delivery, staff, other)', 'INVALID_PERSON_TYPE');
        }
        const buildingId = guard.buildingId;
        const entryLog = await entryLog_model_1.EntryLog.create({
            providerId: guard.providerId,
            buildingId: buildingId,
            guardId: guard._id,
            personName: dto.personName.trim(),
            phone: dto.phone ? dto.phone.trim() : undefined,
            personType: dto.personType,
            purpose: dto.purpose ? dto.purpose.trim() : undefined,
            flatUnit: dto.flatUnit ? dto.flatUnit.trim() : undefined,
            notes: dto.notes ? dto.notes.trim() : undefined,
            entryTime: new Date(),
            exitTime: null,
        });
        return (await entryLog_model_1.EntryLog.findById(entryLog._id)
            .populate('guardId', 'name employeeId designation')
            .populate('buildingId', 'name address'));
    }
    /**
     * Guard marks entry as exited (Any active guard in the same building can close)
     */
    static async markExit(guardUserId, entryLogId) {
        const guard = await this.verifyActiveGuard(guardUserId);
        if (!mongoose_1.Types.ObjectId.isValid(entryLogId)) {
            throw apiError_1.ApiError.badRequest('Invalid entry log ID format', 'INVALID_ID');
        }
        const log = await entryLog_model_1.EntryLog.findById(entryLogId);
        if (!log) {
            throw apiError_1.ApiError.notFound('Entry log record not found', 'ENTRY_LOG_NOT_FOUND');
        }
        const guardBuildingId = guard.buildingId.toString();
        // Security check: Must belong to same provider and building
        if (log.providerId.toString() !== guard.providerId.toString() ||
            log.buildingId.toString() !== guardBuildingId) {
            throw apiError_1.ApiError.forbidden('Access denied. Entry log belongs to another building.', 'BUILDING_ACCESS_DENIED');
        }
        if (log.exitTime !== null && log.exitTime !== undefined) {
            throw apiError_1.ApiError.badRequest('Entry record has already been marked as exited', 'ALREADY_EXITED');
        }
        log.exitTime = new Date();
        await log.save();
        return (await entryLog_model_1.EntryLog.findById(log._id)
            .populate('guardId', 'name employeeId designation')
            .populate('buildingId', 'name address'));
    }
    /**
     * Get active entries currently inside (exitTime == null)
     */
    static async getActiveEntries(user, buildingIdFilter) {
        const query = { exitTime: null };
        const providerIdStr = user.providerId.toString();
        if (user.role === 'guard' || user.role === 'committee') {
            if (!user.buildingId) {
                throw apiError_1.ApiError.badRequest('User is not assigned to a building', 'NO_BUILDING_ASSIGNMENT');
            }
            query.buildingId = new mongoose_1.Types.ObjectId(user.buildingId.toString());
        }
        else if (user.role === 'provider_admin') {
            query.providerId = new mongoose_1.Types.ObjectId(providerIdStr);
            if (buildingIdFilter) {
                if (!mongoose_1.Types.ObjectId.isValid(buildingIdFilter)) {
                    throw apiError_1.ApiError.badRequest('Invalid building ID format', 'INVALID_ID');
                }
                const building = await building_model_1.Building.findById(buildingIdFilter);
                if (!building || building.providerId.toString() !== providerIdStr) {
                    throw apiError_1.ApiError.forbidden('Access denied. Building does not belong to your provider.', 'PROVIDER_ACCESS_DENIED');
                }
                query.buildingId = new mongoose_1.Types.ObjectId(buildingIdFilter);
            }
        }
        return entryLog_model_1.EntryLog.find(query)
            .populate('guardId', 'name employeeId designation')
            .populate('buildingId', 'name address')
            .sort({ entryTime: -1 });
    }
    /**
     * Get historical entry logs with filtering & tenant scoping
     */
    static async getEntryLogs(user, filters) {
        const query = {};
        const providerIdStr = user.providerId.toString();
        if (user.role === 'guard' || user.role === 'committee') {
            if (!user.buildingId) {
                throw apiError_1.ApiError.badRequest('User is not assigned to a building', 'NO_BUILDING_ASSIGNMENT');
            }
            query.buildingId = new mongoose_1.Types.ObjectId(user.buildingId.toString());
        }
        else if (user.role === 'provider_admin') {
            query.providerId = new mongoose_1.Types.ObjectId(providerIdStr);
            if (filters.buildingId) {
                if (!mongoose_1.Types.ObjectId.isValid(filters.buildingId)) {
                    throw apiError_1.ApiError.badRequest('Invalid building ID format', 'INVALID_ID');
                }
                const building = await building_model_1.Building.findById(filters.buildingId);
                if (!building || building.providerId.toString() !== providerIdStr) {
                    throw apiError_1.ApiError.forbidden('Access denied. Building does not belong to your provider.', 'PROVIDER_ACCESS_DENIED');
                }
                query.buildingId = new mongoose_1.Types.ObjectId(filters.buildingId);
            }
            if (filters.guardId) {
                if (!mongoose_1.Types.ObjectId.isValid(filters.guardId)) {
                    throw apiError_1.ApiError.badRequest('Invalid guard ID format', 'INVALID_ID');
                }
                query.guardId = new mongoose_1.Types.ObjectId(filters.guardId);
            }
        }
        if (filters.personType) {
            query.personType = filters.personType;
        }
        if (filters.active === 'true' || filters.active === true) {
            query.exitTime = null;
        }
        else if (filters.active === 'false' || filters.active === false) {
            query.exitTime = { $ne: null };
        }
        if (filters.date) {
            const dayStart = new Date(`${filters.date.trim()}T00:00:00.000Z`);
            const dayEnd = new Date(`${filters.date.trim()}T23:59:59.999Z`);
            query.entryTime = { $gte: dayStart, $lte: dayEnd };
        }
        else if (filters.from || filters.to) {
            query.entryTime = {};
            if (filters.from)
                query.entryTime.$gte = new Date(`${filters.from.trim()}T00:00:00.000Z`);
            if (filters.to)
                query.entryTime.$lte = new Date(`${filters.to.trim()}T23:59:59.999Z`);
        }
        return entryLog_model_1.EntryLog.find(query)
            .populate('guardId', 'name employeeId designation')
            .populate('buildingId', 'name address')
            .sort({ entryTime: -1 })
            .limit(100);
    }
    /**
     * Get single Entry Log by ID with tenant verification
     */
    static async getEntryLogById(user, entryLogId) {
        if (!mongoose_1.Types.ObjectId.isValid(entryLogId)) {
            throw apiError_1.ApiError.badRequest('Invalid entry log ID format', 'INVALID_ID');
        }
        const log = await entryLog_model_1.EntryLog.findById(entryLogId)
            .populate('guardId', 'name employeeId designation phone email')
            .populate('buildingId', 'name address contactPhone');
        if (!log) {
            throw apiError_1.ApiError.notFound('Entry log record not found', 'ENTRY_LOG_NOT_FOUND');
        }
        if (user.role === 'guard' || user.role === 'committee') {
            if (!user.buildingId || log.buildingId._id.toString() !== user.buildingId.toString()) {
                throw apiError_1.ApiError.forbidden('Access denied. Entry log belongs to another building.', 'BUILDING_ACCESS_DENIED');
            }
        }
        else if (user.role === 'provider_admin') {
            if (log.providerId.toString() !== user.providerId.toString()) {
                throw apiError_1.ApiError.forbidden('Access denied. Entry log belongs to another provider.', 'PROVIDER_ACCESS_DENIED');
            }
        }
        return log;
    }
}
exports.EntryLogService = EntryLogService;
