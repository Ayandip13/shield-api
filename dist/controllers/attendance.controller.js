"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkInGuard = checkInGuard;
exports.checkOutGuard = checkOutGuard;
exports.getGuardAttendanceHistory = getGuardAttendanceHistory;
exports.getGuardTodayStatus = getGuardTodayStatus;
exports.getProviderAttendance = getProviderAttendance;
exports.getCommitteeAttendance = getCommitteeAttendance;
const attendance_service_1 = require("../services/attendance.service");
const apiResponse_1 = require("../utils/apiResponse");
async function checkInGuard(req, res, next) {
    try {
        const guardUserId = req.user.id;
        const attendance = await attendance_service_1.AttendanceService.checkIn(guardUserId);
        apiResponse_1.ApiResponse.success(res, 201, 'Duty check-in successful', attendance);
    }
    catch (error) {
        next(error);
    }
}
async function checkOutGuard(req, res, next) {
    try {
        const guardUserId = req.user.id;
        const { notes } = req.body;
        const attendance = await attendance_service_1.AttendanceService.checkOut(guardUserId, notes);
        apiResponse_1.ApiResponse.success(res, 200, 'Duty check-out successful', attendance);
    }
    catch (error) {
        next(error);
    }
}
async function getGuardAttendanceHistory(req, res, next) {
    try {
        const guardUserId = req.user.id;
        const from = req.query.from ? req.query.from : undefined;
        const to = req.query.to ? req.query.to : undefined;
        const history = await attendance_service_1.AttendanceService.getGuardHistory(guardUserId, from, to);
        apiResponse_1.ApiResponse.success(res, 200, 'Attendance history retrieved successfully', history);
    }
    catch (error) {
        next(error);
    }
}
async function getGuardTodayStatus(req, res, next) {
    try {
        const guardUserId = req.user.id;
        const status = await attendance_service_1.AttendanceService.getGuardTodayStatus(guardUserId);
        apiResponse_1.ApiResponse.success(res, 200, 'Today duty attendance status retrieved', status);
    }
    catch (error) {
        next(error);
    }
}
async function getProviderAttendance(req, res, next) {
    try {
        const providerId = req.user.providerId.toString();
        const buildingId = req.query.buildingId ? req.query.buildingId : undefined;
        const guardId = req.query.guardId ? req.query.guardId : undefined;
        const date = req.query.date ? req.query.date : undefined;
        const from = req.query.from ? req.query.from : undefined;
        const to = req.query.to ? req.query.to : undefined;
        const records = await attendance_service_1.AttendanceService.getProviderAttendance(providerId, {
            buildingId,
            guardId,
            date,
            from,
            to,
        });
        apiResponse_1.ApiResponse.success(res, 200, 'Provider attendance records retrieved successfully', records);
    }
    catch (error) {
        next(error);
    }
}
async function getCommitteeAttendance(req, res, next) {
    try {
        const committeeUserId = req.user.id;
        const date = req.query.date ? req.query.date : undefined;
        const from = req.query.from ? req.query.from : undefined;
        const to = req.query.to ? req.query.to : undefined;
        const records = await attendance_service_1.AttendanceService.getCommitteeAttendance(committeeUserId, {
            date,
            from,
            to,
        });
        apiResponse_1.ApiResponse.success(res, 200, 'Building attendance records retrieved successfully', records);
    }
    catch (error) {
        next(error);
    }
}
