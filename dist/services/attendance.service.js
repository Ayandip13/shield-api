"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceService = void 0;
const mongoose_1 = require("mongoose");
const attendance_model_1 = require("../models/attendance.model");
const user_model_1 = require("../models/user.model");
const building_model_1 = require("../models/building.model");
const shift_service_1 = require("./shift.service");
const apiError_1 = require("../utils/apiError");
const date_util_1 = require("../utils/date.util");
class AttendanceService {
    /**
     * Helper to verify guard user eligibility
     */
    static async verifyGuardUser(guardUserId) {
        if (!mongoose_1.Types.ObjectId.isValid(guardUserId)) {
            throw apiError_1.ApiError.badRequest('Invalid guard user ID format', 'INVALID_ID');
        }
        const guard = await user_model_1.User.findById(guardUserId);
        if (!guard || guard.role !== 'guard') {
            throw apiError_1.ApiError.notFound('Guard record not found', 'GUARD_NOT_FOUND');
        }
        if (!guard.isActive) {
            throw apiError_1.ApiError.forbidden('Inactive guard account. Duty operations disabled.', 'GUARD_INACTIVE');
        }
        if (!guard.buildingId) {
            throw apiError_1.ApiError.badRequest('Guard is not assigned to any building', 'GUARD_NO_BUILDING');
        }
        return guard;
    }
    /**
     * Guard Duty Check-In
     */
    static async checkIn(guardUserId) {
        const guard = await this.verifyGuardUser(guardUserId);
        // Enforce one open attendance record per guard at a time
        const openRecord = await attendance_model_1.Attendance.findOne({
            guardId: guard._id,
            checkOut: null,
        });
        if (openRecord) {
            throw apiError_1.ApiError.badRequest('You already have an open duty check-in session. Please check out before starting a new duty session.', 'OPEN_ATTENDANCE_EXISTS');
        }
        const todayStr = (0, date_util_1.formatDateToYYYYMMDD)(new Date());
        try {
            const attendance = await attendance_model_1.Attendance.create({
                guardId: guard._id,
                providerId: guard.providerId,
                buildingId: guard.buildingId,
                date: todayStr,
                checkIn: new Date(),
                checkOut: null,
                status: 'present',
            });
            return (await attendance_model_1.Attendance.findById(attendance._id)
                .populate('guardId', 'name email phone employeeId designation')
                .populate('buildingId', 'name address'));
        }
        catch (err) {
            if (err.code === 11000 || err.message?.includes('duplicate key')) {
                throw apiError_1.ApiError.badRequest('An active check-in session already exists for your account.', 'OPEN_ATTENDANCE_EXISTS');
            }
            throw err;
        }
    }
    /**
     * Guard Duty Check-Out
     */
    static async checkOut(guardUserId, notes) {
        const guard = await this.verifyGuardUser(guardUserId);
        const openRecord = await attendance_model_1.Attendance.findOne({
            guardId: guard._id,
            checkOut: null,
        });
        if (!openRecord) {
            throw apiError_1.ApiError.badRequest('No active check-in session found. You must check in before checking out.', 'NO_OPEN_ATTENDANCE');
        }
        openRecord.checkOut = new Date();
        if (notes && typeof notes === 'string') {
            openRecord.notes = notes.trim();
        }
        await openRecord.save();
        return (await attendance_model_1.Attendance.findById(openRecord._id)
            .populate('guardId', 'name email phone employeeId designation')
            .populate('buildingId', 'name address'));
    }
    /**
     * Get Guard's own attendance history
     */
    static async getGuardHistory(guardUserId, from, to) {
        await this.verifyGuardUser(guardUserId);
        const query = {
            guardId: new mongoose_1.Types.ObjectId(guardUserId),
        };
        if (from || to) {
            query.date = {};
            if (from)
                query.date.$gte = from.trim();
            if (to)
                query.date.$lte = to.trim();
        }
        return attendance_model_1.Attendance.find(query)
            .populate('buildingId', 'name address')
            .sort({ checkIn: -1 });
    }
    /**
     * Get Guard's current duty state & today's attendance summary
     */
    static async getGuardTodayStatus(guardUserId) {
        const guard = await this.verifyGuardUser(guardUserId);
        const shift = await shift_service_1.ShiftService.getGuardShift(guardUserId);
        const todayStr = (0, date_util_1.formatDateToYYYYMMDD)(new Date());
        // 1. Check for open session first
        const openRecord = await attendance_model_1.Attendance.findOne({
            guardId: guard._id,
            checkOut: null,
        })
            .populate('buildingId', 'name address')
            .sort({ checkIn: -1 });
        if (openRecord) {
            return {
                state: 'CHECKED_IN',
                attendance: openRecord,
                shift,
                guard: {
                    id: guard._id,
                    name: guard.name,
                    employeeId: guard.employeeId,
                    building: guard.buildingId,
                },
            };
        }
        // 2. Check for completed record today
        const completedRecord = await attendance_model_1.Attendance.findOne({
            guardId: guard._id,
            date: todayStr,
            checkOut: { $ne: null },
        })
            .populate('buildingId', 'name address')
            .sort({ checkIn: -1 });
        if (completedRecord) {
            return {
                state: 'CHECKED_OUT',
                attendance: completedRecord,
                shift,
                guard: {
                    id: guard._id,
                    name: guard.name,
                    employeeId: guard.employeeId,
                    building: guard.buildingId,
                },
            };
        }
        return {
            state: 'NOT_CHECKED_IN',
            attendance: null,
            shift,
            guard: {
                id: guard._id,
                name: guard.name,
                employeeId: guard.employeeId,
                building: guard.buildingId,
            },
        };
    }
    /**
     * Provider Admin multi-building attendance query with tenant isolation
     */
    static async getProviderAttendance(providerId, filters) {
        if (!mongoose_1.Types.ObjectId.isValid(providerId)) {
            throw apiError_1.ApiError.badRequest('Invalid provider ID format', 'INVALID_ID');
        }
        const query = {
            providerId: new mongoose_1.Types.ObjectId(providerId),
        };
        if (filters.buildingId) {
            if (!mongoose_1.Types.ObjectId.isValid(filters.buildingId)) {
                throw apiError_1.ApiError.badRequest('Invalid building ID format', 'INVALID_ID');
            }
            const building = await building_model_1.Building.findById(filters.buildingId);
            if (!building || building.providerId.toString() !== providerId.toString()) {
                throw apiError_1.ApiError.forbidden('Access denied. Building does not belong to your provider.', 'PROVIDER_ACCESS_DENIED');
            }
            query.buildingId = new mongoose_1.Types.ObjectId(filters.buildingId);
        }
        if (filters.guardId) {
            if (!mongoose_1.Types.ObjectId.isValid(filters.guardId)) {
                throw apiError_1.ApiError.badRequest('Invalid guard ID format', 'INVALID_ID');
            }
            const guardUser = await user_model_1.User.findById(filters.guardId);
            if (!guardUser || guardUser.providerId.toString() !== providerId.toString()) {
                throw apiError_1.ApiError.forbidden('Access denied. Guard does not belong to your provider.', 'PROVIDER_ACCESS_DENIED');
            }
            query.guardId = new mongoose_1.Types.ObjectId(filters.guardId);
        }
        if (filters.date) {
            query.date = filters.date.trim();
        }
        else if (filters.from || filters.to) {
            query.date = {};
            if (filters.from)
                query.date.$gte = filters.from.trim();
            if (filters.to)
                query.date.$lte = filters.to.trim();
        }
        return attendance_model_1.Attendance.find(query)
            .populate('guardId', 'name email phone employeeId designation')
            .populate('buildingId', 'name address')
            .sort({ checkIn: -1 });
    }
    /**
     * Committee building attendance query strictly scoped to committee user's building
     */
    static async getCommitteeAttendance(committeeUserId, filters) {
        const committeeUser = await user_model_1.User.findById(committeeUserId);
        if (!committeeUser || committeeUser.role !== 'committee') {
            throw apiError_1.ApiError.notFound('Committee member record not found', 'MEMBER_NOT_FOUND');
        }
        if (!committeeUser.buildingId) {
            throw apiError_1.ApiError.badRequest('Committee user is not assigned to any building', 'COMMITTEE_NO_BUILDING');
        }
        const query = {
            buildingId: committeeUser.buildingId,
        };
        if (filters.date) {
            query.date = filters.date.trim();
        }
        else if (filters.from || filters.to) {
            query.date = {};
            if (filters.from)
                query.date.$gte = filters.from.trim();
            if (filters.to)
                query.date.$lte = filters.to.trim();
        }
        return attendance_model_1.Attendance.find(query)
            .populate('guardId', 'name email phone employeeId designation')
            .populate('buildingId', 'name address')
            .sort({ checkIn: -1 });
    }
}
exports.AttendanceService = AttendanceService;
