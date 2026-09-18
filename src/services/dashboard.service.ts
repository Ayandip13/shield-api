import { Types } from 'mongoose';
import { Building } from '../models/building.model';
import { User } from '../models/user.model';
import { Attendance } from '../models/attendance.model';
import { EntryLog } from '../models/entryLog.model';
import { Shift } from '../models/shift.model';
import { formatDateToYYYYMMDD } from '../utils/date.util';
import { AuthUser } from '../types/express';

export interface ActivityItem {
  id: string;
  type: 'ENTRY' | 'EXIT' | 'ATTENDANCE';
  timestamp: Date;
  title: string;
  description: string;
  buildingName: string;
  buildingId: string;
  personType?: string;
  guardName?: string;
}

export interface ProviderDashboardSummary {
  totalBuildings: number;
  activeBuildings: number;
  activeGuards: number;
  presentToday: number;
  currentlyOnDuty: number;
  currentlyInside: number;
  todayEntries: number;
}

export interface CommitteeDashboardSummary {
  activeGuards: number;
  presentToday: number;
  currentlyOnDuty: number;
  currentlyInside: number;
  todayEntries: number;
}

function getStartAndEndOfDay(date = new Date()) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return { startOfDay, endOfDay };
}

function formatPersonType(personType?: string): string {
  if (!personType) return 'Visitor';
  return personType.charAt(0).toUpperCase() + personType.slice(1);
}

/**
 * Fetch and normalize recent security activities from EntryLog and Attendance models
 */
async function fetchRecentActivities(
  providerId: Types.ObjectId | string,
  buildingId?: Types.ObjectId | string,
  limit = 10
): Promise<ActivityItem[]> {
  const filter: any = { providerId };
  if (buildingId) {
    filter.buildingId = buildingId;
  }

  // Fetch recent entry logs and attendance records concurrently
  const [entryLogs, attendanceRecords] = await Promise.all([
    EntryLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 2)
      .populate('buildingId', 'name')
      .populate('guardId', 'name')
      .lean(),
    Attendance.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 2)
      .populate('buildingId', 'name')
      .populate('guardId', 'name')
      .lean(),
  ]);

  const activities: ActivityItem[] = [];

  for (const log of entryLogs) {
    const bObj = log.buildingId as any;
    const bName = bObj && typeof bObj === 'object' && 'name' in bObj ? bObj.name : 'Building';
    const bId = bObj && typeof bObj === 'object' && '_id' in bObj ? bObj._id.toString() : (log.buildingId ? (log.buildingId as any).toString() : '');

    const pType = formatPersonType(log.personType);
    const dest = log.flatUnit ? `Flat ${log.flatUnit}` : log.purpose || 'General';

    // Entry activity item
    if (log.entryTime) {
      activities.push({
        id: `entry_${(log._id as any).toString()}`,
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
        id: `exit_${(log._id as any).toString()}`,
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
    const bObj = att.buildingId as any;
    const bName = bObj && typeof bObj === 'object' && 'name' in bObj ? bObj.name : 'Building';
    const bId = bObj && typeof bObj === 'object' && '_id' in bObj ? bObj._id.toString() : (att.buildingId ? (att.buildingId as any).toString() : '');

    const gObj = att.guardId as any;
    const gName = gObj && typeof gObj === 'object' && 'name' in gObj ? gObj.name : 'Guard';

    // Check-in activity
    if (att.checkIn) {
      activities.push({
        id: `checkin_${(att._id as any).toString()}`,
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
        id: `checkout_${(att._id as any).toString()}`,
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
export async function getProviderDashboardData(
  providerId: Types.ObjectId | string,
  buildingIdFilter?: string
) {
  const pId = new Types.ObjectId(providerId.toString());
  const bId = buildingIdFilter ? new Types.ObjectId(buildingIdFilter) : undefined;

  const todayStr = formatDateToYYYYMMDD(new Date());
  const { startOfDay, endOfDay } = getStartAndEndOfDay();

  // Queries base filters
  const buildingBaseFilter: any = { providerId: pId };
  const guardBaseFilter: any = { providerId: pId, role: 'guard', isActive: true };
  const attendanceBaseFilter: any = { providerId: pId, date: todayStr };
  const onDutyFilter: any = { providerId: pId, checkOut: null };
  const currentlyInsideFilter: any = { providerId: pId, exitTime: null };
  const todayEntriesFilter: any = {
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

  const [
    totalBuildings,
    activeBuildings,
    activeGuards,
    presentToday,
    currentlyOnDuty,
    currentlyInside,
    todayEntries,
    recentActivity,
  ] = await Promise.all([
    bId
      ? Building.countDocuments({ _id: bId, providerId: pId })
      : Building.countDocuments(buildingBaseFilter),
    bId
      ? Building.countDocuments({ _id: bId, providerId: pId, isActive: true })
      : Building.countDocuments({ ...buildingBaseFilter, isActive: true }),
    User.countDocuments(guardBaseFilter),
    Attendance.countDocuments(attendanceBaseFilter),
    Attendance.countDocuments(onDutyFilter),
    EntryLog.countDocuments(currentlyInsideFilter),
    EntryLog.countDocuments(todayEntriesFilter),
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
export async function getCommitteeDashboardData(user: AuthUser) {
  if (!user.buildingId) {
    throw new Error('Committee member is not associated with any building.');
  }

  const pId = new Types.ObjectId(user.providerId.toString());
  const bId = new Types.ObjectId(user.buildingId.toString());

  const building = await Building.findOne({ _id: bId, providerId: pId }).lean();
  if (!building) {
    throw new Error('Assigned building was not found.');
  }

  const todayStr = formatDateToYYYYMMDD(new Date());
  const { startOfDay, endOfDay } = getStartAndEndOfDay();

  const [
    activeGuards,
    presentToday,
    currentlyOnDuty,
    currentlyInside,
    todayEntries,
    recentActivity,
  ] = await Promise.all([
    User.countDocuments({ providerId: pId, buildingId: bId, role: 'guard', isActive: true }),
    Attendance.countDocuments({ providerId: pId, buildingId: bId, date: todayStr }),
    Attendance.countDocuments({ providerId: pId, buildingId: bId, checkOut: null }),
    EntryLog.countDocuments({ providerId: pId, buildingId: bId, exitTime: null }),
    EntryLog.countDocuments({
      providerId: pId,
      buildingId: bId,
      entryTime: { $gte: startOfDay, $lte: endOfDay },
    }),
    fetchRecentActivities(pId, bId, 10),
  ]);

  return {
    building: {
      id: (building._id as any).toString(),
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
export async function getGuardDashboardData(user: AuthUser) {
  const guard = await User.findById(user.id).populate('buildingId', 'name address').lean();

  if (!guard) {
    throw new Error('Guard user profile not found.');
  }

  let shift: any = null;
  if (guard.buildingId) {
    const shiftDoc = await Shift.findOne({
      guardId: guard._id,
      buildingId: typeof guard.buildingId === 'object' ? (guard.buildingId as any)._id : guard.buildingId,
    }).lean();
    if (shiftDoc) {
      shift = {
        startTime: shiftDoc.startTime,
        endTime: shiftDoc.endTime,
      };
    }
  }

  const todayStr = formatDateToYYYYMMDD(new Date());
  const todayAttendance = await Attendance.findOne({
    guardId: guard._id,
    date: todayStr,
  }).lean();

  let status: 'NOT_CHECKED_IN' | 'CHECKED_IN' | 'CHECKED_OUT' = 'NOT_CHECKED_IN';
  if (todayAttendance) {
    status = todayAttendance.checkOut ? 'CHECKED_OUT' : 'CHECKED_IN';
  }

  const buildingObj =
    guard.buildingId && typeof guard.buildingId === 'object' && 'name' in guard.buildingId
      ? {
          id: (guard.buildingId as any)._id.toString(),
          name: (guard.buildingId as any).name,
          address: (guard.buildingId as any).address,
        }
      : null;

  return {
    guard: {
      id: (guard._id as any).toString(),
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
export async function getSecurityActivityStream(
  user: AuthUser,
  buildingIdFilter?: string,
  limit = 20
): Promise<ActivityItem[]> {
  const pId = user.providerId;
  let targetBuildingId: Types.ObjectId | string | undefined = undefined;

  if (user.role === 'committee') {
    targetBuildingId = user.buildingId;
  } else if (user.role === 'provider_admin' && buildingIdFilter) {
    targetBuildingId = buildingIdFilter;
  }

  return fetchRecentActivities(pId, targetBuildingId, limit);
}
