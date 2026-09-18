"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProviderDashboardData = getProviderDashboardData;
exports.getCommitteeDashboardData = getCommitteeDashboardData;
exports.getGuardDashboardData = getGuardDashboardData;
exports.getSecurityActivityStream = getSecurityActivityStream;
const mongoose_1 = require("mongoose");
const building_model_1 = require("../models/building.model");
const user_model_1 = require("../models/user.model");
const attendance_model_1 = require("../models/attendance.model");
const entryLog_model_1 = require("../models/entryLog.model");
const shift_model_1 = require("../models/shift.model");
const date_util_1 = require("../utils/date.util");
function getStartAndEndOfDay(date = new Date()) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    return { startOfDay, endOfDay };
}
function formatPersonType(personType) {
    if (!personType)
        return 'Visitor';
    return personType.charAt(0).toUpperCase() + personType.slice(1);
}
/**
 * Fetch and normalize recent security activities from EntryLog and Attendance models
 */
async function fetchRecentActivities(providerId, buildingId, limit = 10) {
    const filter = { providerId };
    if (buildingId) {
        filter.buildingId = buildingId;
    }
    // Fetch recent entry logs and attendance records concurrently
    const [entryLogs, attendanceRecords] = await Promise.all([
        entryLog_model_1.EntryLog.find(filter)
            .sort({ createdAt: -1 })
            .limit(limit * 2)
            .populate('buildingId', 'name')
            .populate('guardId', 'name')
            .lean(),
        attendance_model_1.Attendance.find(filter)
            .sort({ createdAt: -1 })
            .limit(limit * 2)
            .populate('buildingId', 'name')
            .populate('guardId', 'name')
            .lean(),
    ]);
    const activities = [];
    for (const log of entryLogs) {
        const bObj = log.buildingId;
        const bName = bObj && typeof bObj === 'object' && 'name' in bObj ? bObj.name : 'Building';
        const bId = bObj && typeof bObj === 'object' && '_id' in bObj ? bObj._id.toString() : (log.buildingId ? log.buildingId.toString() : '');
        const pType = formatPersonType(log.personType);
        const dest = log.flatUnit ? `Flat ${log.flatUnit}` : log.purpose || 'General';
        // Entry activity item
        if (log.entryTime) {
            activities.push({
                id: `entry_${log._id.toString()}`,
                type: 'ENTRY',
                timestamp: new Date(log.entryTime),
                title: `${log.personName} entered`,
                description: `${pType} · ${dest}`,
                buildingName: bName,
                buildingId: bId,
                personType: log.personType,
            });
        }
        // Exit activity item if exited
        if (log.exitTime) {
            activities.push({
                id: `exit_${log._id.toString()}`,
                type: 'EXIT',
                timestamp: new Date(log.exitTime),
                title: `${log.personName} exited`,
                description: `${pType} · ${dest}`,
                buildingName: bName,
                buildingId: bId,
                personType: log.personType,
            });
        }
    }
    for (const att of attendanceRecords) {
        const bObj = att.buildingId;
        const bName = bObj && typeof bObj === 'object' && 'name' in bObj ? bObj.name : 'Building';
        const bId = bObj && typeof bObj === 'object' && '_id' in bObj ? bObj._id.toString() : (att.buildingId ? att.buildingId.toString() : '');
        const gObj = att.guardId;
        const gName = gObj && typeof gObj === 'object' && 'name' in gObj ? gObj.name : 'Guard';
        // Check-in activity
        if (att.checkIn) {
            activities.push({
                id: `checkin_${att._id.toString()}`,
                type: 'ATTENDANCE',
                timestamp: new Date(att.checkIn),
                title: `${gName} checked in`,
                description: `Duty check-in at ${bName}`,
                buildingName: bName,
                buildingId: bId,
                guardName: gName,
            });
        }
        // Check-out activity
        if (att.checkOut) {
            activities.push({
                id: `checkout_${att._id.toString()}`,
                type: 'ATTENDANCE',
                timestamp: new Date(att.checkOut),
                title: `${gName} checked out`,
                description: `Duty check-out at ${bName}`,
                buildingName: bName,
                buildingId: bId,
                guardName: gName,
            });
        }
    }
    // Sort descending by timestamp
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return activities.slice(0, limit);
}
/**
 * Service: Provider Admin Dashboard Overview
 */
async function getProviderDashboardData(providerId, buildingIdFilter) {
    const pId = new mongoose_1.Types.ObjectId(providerId.toString());
    const bId = buildingIdFilter ? new mongoose_1.Types.ObjectId(buildingIdFilter) : undefined;
    const todayStr = (0, date_util_1.formatDateToYYYYMMDD)(new Date());
    const { startOfDay, endOfDay } = getStartAndEndOfDay();
    // Queries base filters
    const buildingBaseFilter = { providerId: pId };
    const guardBaseFilter = { providerId: pId, role: 'guard', isActive: true };
    const attendanceBaseFilter = { providerId: pId, date: todayStr };
    const onDutyFilter = { providerId: pId, checkOut: null };
    const currentlyInsideFilter = { providerId: pId, exitTime: null };
    const todayEntriesFilter = {
        providerId: pId,
        entryTime: { $gte: startOfDay, $lte: endOfDay },
    };
    if (bId) {
        buildingBaseFilter._id = bId;
        guardBaseFilter.buildingId = bId;
        attendanceBaseFilter.buildingId = bId;
        onDutyFilter.buildingId = bId;
        currentlyInsideFilter.buildingId = bId;
        todayEntriesFilter.buildingId = bId;
    }
    const [totalBuildings, activeBuildings, activeGuards, presentToday, currentlyOnDuty, currentlyInside, todayEntries, recentActivity,] = await Promise.all([
        bId
            ? building_model_1.Building.countDocuments({ _id: bId, providerId: pId })
            : building_model_1.Building.countDocuments(buildingBaseFilter),
        bId
            ? building_model_1.Building.countDocuments({ _id: bId, providerId: pId, isActive: true })
            : building_model_1.Building.countDocuments({ ...buildingBaseFilter, isActive: true }),
        user_model_1.User.countDocuments(guardBaseFilter),
        attendance_model_1.Attendance.countDocuments(attendanceBaseFilter),
        attendance_model_1.Attendance.countDocuments(onDutyFilter),
        entryLog_model_1.EntryLog.countDocuments(currentlyInsideFilter),
        entryLog_model_1.EntryLog.countDocuments(todayEntriesFilter),
        fetchRecentActivities(pId, bId, 10),
    ]);
    return {
        summary: {
            totalBuildings,
            activeBuildings,
            activeGuards,
            presentToday,
            currentlyOnDuty,
            currentlyInside,
            todayEntries,
        },
        recentActivity,
    };
}
/**
 * Service: Building Committee Member Dashboard
 */
async function getCommitteeDashboardData(user) {
    if (!user.buildingId) {
        throw new Error('Committee member is not associated with any building.');
    }
    const pId = new mongoose_1.Types.ObjectId(user.providerId.toString());
    const bId = new mongoose_1.Types.ObjectId(user.buildingId.toString());
    const building = await building_model_1.Building.findOne({ _id: bId, providerId: pId }).lean();
    if (!building) {
        throw new Error('Assigned building was not found.');
    }
    const todayStr = (0, date_util_1.formatDateToYYYYMMDD)(new Date());
    const { startOfDay, endOfDay } = getStartAndEndOfDay();
    const [activeGuards, presentToday, currentlyOnDuty, currentlyInside, todayEntries, recentActivity,] = await Promise.all([
        user_model_1.User.countDocuments({ providerId: pId, buildingId: bId, role: 'guard', isActive: true }),
        attendance_model_1.Attendance.countDocuments({ providerId: pId, buildingId: bId, date: todayStr }),
        attendance_model_1.Attendance.countDocuments({ providerId: pId, buildingId: bId, checkOut: null }),
        entryLog_model_1.EntryLog.countDocuments({ providerId: pId, buildingId: bId, exitTime: null }),
        entryLog_model_1.EntryLog.countDocuments({
            providerId: pId,
            buildingId: bId,
            entryTime: { $gte: startOfDay, $lte: endOfDay },
        }),
        fetchRecentActivities(pId, bId, 10),
    ]);
    return {
        building: {
            id: building._id.toString(),
            name: building.name,
            address: building.address,
        },
        summary: {
            activeGuards,
            presentToday,
            currentlyOnDuty,
            currentlyInside,
            todayEntries,
        },
        recentActivity,
    };
}
/**
 * Service: Guard Duty Dashboard Minimal Summary
 */
async function getGuardDashboardData(user) {
    const guard = await user_model_1.User.findById(user.id).populate('buildingId', 'name address').lean();
    if (!guard) {
        throw new Error('Guard user profile not found.');
    }
    let shift = null;
    if (guard.buildingId) {
        const shiftDoc = await shift_model_1.Shift.findOne({
            guardId: guard._id,
            buildingId: typeof guard.buildingId === 'object' ? guard.buildingId._id : guard.buildingId,
        }).lean();
        if (shiftDoc) {
            shift = {
                startTime: shiftDoc.startTime,
                endTime: shiftDoc.endTime,
            };
        }
    }
    const todayStr = (0, date_util_1.formatDateToYYYYMMDD)(new Date());
    const todayAttendance = await attendance_model_1.Attendance.findOne({
        guardId: guard._id,
        date: todayStr,
    }).lean();
    let status = 'NOT_CHECKED_IN';
    if (todayAttendance) {
        status = todayAttendance.checkOut ? 'CHECKED_OUT' : 'CHECKED_IN';
    }
    const buildingObj = guard.buildingId && typeof guard.buildingId === 'object' && 'name' in guard.buildingId
        ? {
            id: guard.buildingId._id.toString(),
            name: guard.buildingId.name,
            address: guard.buildingId.address,
        }
        : null;
    return {
        guard: {
            id: guard._id.toString(),
            name: guard.name,
            employeeId: guard.employeeId || null,
        },
        building: buildingObj,
        shift,
        todayStatus: {
            status,
            checkIn: todayAttendance?.checkIn || null,
            checkOut: todayAttendance?.checkOut || null,
        },
    };
}
/**
 * Service: Paginated Full Security Activity Stream
 */
async function getSecurityActivityStream(user, buildingIdFilter, limit = 20) {
    const pId = user.providerId;
    let targetBuildingId = undefined;
    if (user.role === 'committee') {
        targetBuildingId = user.buildingId;
    }
    else if (user.role === 'provider_admin' && buildingIdFilter) {
        targetBuildingId = buildingIdFilter;
    }
    return fetchRecentActivities(pId, targetBuildingId, limit);
}
