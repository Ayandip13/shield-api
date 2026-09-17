import { Types } from 'mongoose';
import { Attendance, IAttendance } from '../models/attendance.model';
import { User } from '../models/user.model';
import { Building } from '../models/building.model';
import { ShiftService } from './shift.service';
import { ApiError } from '../utils/apiError';
import { formatDateToYYYYMMDD } from '../utils/date.util';

export interface ProviderAttendanceFilters {
  buildingId?: string;
  guardId?: string;
  date?: string;
  from?: string;
  to?: string;
}

export interface CommitteeAttendanceFilters {
  date?: string;
  from?: string;
  to?: string;
}

export class AttendanceService {
  /**
   * Helper to verify guard user eligibility
   */
  private static async verifyGuardUser(guardUserId: string) {
    if (!Types.ObjectId.isValid(guardUserId)) {
      throw ApiError.badRequest('Invalid guard user ID format', 'INVALID_ID');
    }
    const guard = await User.findById(guardUserId);
    if (!guard || guard.role !== 'guard') {
      throw ApiError.notFound('Guard record not found', 'GUARD_NOT_FOUND');
    }
    if (!guard.isActive) {
      throw ApiError.forbidden('Inactive guard account. Duty operations disabled.', 'GUARD_INACTIVE');
    }
    if (!guard.buildingId) {
      throw ApiError.badRequest('Guard is not assigned to any building', 'GUARD_NO_BUILDING');
    }
    return guard;
  }

  /**
   * Guard Duty Check-In
   */
  static async checkIn(guardUserId: string): Promise<IAttendance> {
    const guard = await this.verifyGuardUser(guardUserId);

    // Enforce one open attendance record per guard at a time
    const openRecord = await Attendance.findOne({
      guardId: guard._id,
      checkOut: null,
    });

    if (openRecord) {
      throw ApiError.badRequest(
        'You already have an open duty check-in session. Please check out before starting a new duty session.',
        'OPEN_ATTENDANCE_EXISTS'
      );
    }

    const todayStr = formatDateToYYYYMMDD(new Date());

    try {
      const attendance = await Attendance.create({
        guardId: guard._id,
        providerId: guard.providerId,
        buildingId: guard.buildingId,
        date: todayStr,
        checkIn: new Date(),
        checkOut: null,
        status: 'present',
      });

      return (await Attendance.findById(attendance._id)
        .populate('guardId', 'name email phone employeeId designation')
        .populate('buildingId', 'name address'))!;
    } catch (err: any) {
      if (err.code === 11000 || err.message?.includes('duplicate key')) {
        throw ApiError.badRequest(
          'An active check-in session already exists for your account.',
          'OPEN_ATTENDANCE_EXISTS'
        );
      }
      throw err;
    }
  }

  /**
   * Guard Duty Check-Out
   */
  static async checkOut(guardUserId: string, notes?: string): Promise<IAttendance> {
    const guard = await this.verifyGuardUser(guardUserId);

    const openRecord = await Attendance.findOne({
      guardId: guard._id,
      checkOut: null,
    });

    if (!openRecord) {
      throw ApiError.badRequest(
        'No active check-in session found. You must check in before checking out.',
        'NO_OPEN_ATTENDANCE'
      );
    }

    openRecord.checkOut = new Date();
    if (notes && typeof notes === 'string') {
      openRecord.notes = notes.trim();
    }

    await openRecord.save();

    return (await Attendance.findById(openRecord._id)
      .populate('guardId', 'name email phone employeeId designation')
      .populate('buildingId', 'name address'))!;
  }

  /**
   * Get Guard's own attendance history
   */
  static async getGuardHistory(guardUserId: string, from?: string, to?: string): Promise<IAttendance[]> {
    await this.verifyGuardUser(guardUserId);

    const query: any = {
      guardId: new Types.ObjectId(guardUserId),
    };

    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = from.trim();
      if (to) query.date.$lte = to.trim();
    }

    return Attendance.find(query)
      .populate('buildingId', 'name address')
      .sort({ checkIn: -1 });
  }

  /**
   * Get Guard's current duty state & today's attendance summary
   */
  static async getGuardTodayStatus(guardUserId: string) {
    const guard = await this.verifyGuardUser(guardUserId);
    const shift = await ShiftService.getGuardShift(guardUserId);
    const todayStr = formatDateToYYYYMMDD(new Date());

    // 1. Check for open session first
    const openRecord = await Attendance.findOne({
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
    const completedRecord = await Attendance.findOne({
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
  static async getProviderAttendance(
    providerId: string,
    filters: ProviderAttendanceFilters
  ): Promise<IAttendance[]> {
    if (!Types.ObjectId.isValid(providerId)) {
      throw ApiError.badRequest('Invalid provider ID format', 'INVALID_ID');
    }

    const query: any = {
      providerId: new Types.ObjectId(providerId),
    };

    if (filters.buildingId) {
      if (!Types.ObjectId.isValid(filters.buildingId)) {
        throw ApiError.badRequest('Invalid building ID format', 'INVALID_ID');
      }
      const building = await Building.findById(filters.buildingId);
      if (!building || building.providerId.toString() !== providerId.toString()) {
        throw ApiError.forbidden('Access denied. Building does not belong to your provider.', 'PROVIDER_ACCESS_DENIED');
      }
      query.buildingId = new Types.ObjectId(filters.buildingId);
    }

    if (filters.guardId) {
      if (!Types.ObjectId.isValid(filters.guardId)) {
        throw ApiError.badRequest('Invalid guard ID format', 'INVALID_ID');
      }
      const guardUser = await User.findById(filters.guardId);
      if (!guardUser || guardUser.providerId.toString() !== providerId.toString()) {
        throw ApiError.forbidden('Access denied. Guard does not belong to your provider.', 'PROVIDER_ACCESS_DENIED');
      }
      query.guardId = new Types.ObjectId(filters.guardId);
    }

    if (filters.date) {
      query.date = filters.date.trim();
    } else if (filters.from || filters.to) {
      query.date = {};
      if (filters.from) query.date.$gte = filters.from.trim();
      if (filters.to) query.date.$lte = filters.to.trim();
    }

    return Attendance.find(query)
      .populate('guardId', 'name email phone employeeId designation')
      .populate('buildingId', 'name address')
      .sort({ checkIn: -1 });
  }

  /**
   * Committee building attendance query strictly scoped to committee user's building
   */
  static async getCommitteeAttendance(
    committeeUserId: string,
    filters: CommitteeAttendanceFilters
  ): Promise<IAttendance[]> {
    const committeeUser = await User.findById(committeeUserId);
    if (!committeeUser || committeeUser.role !== 'committee') {
      throw ApiError.notFound('Committee member record not found', 'MEMBER_NOT_FOUND');
    }

    if (!committeeUser.buildingId) {
      throw ApiError.badRequest('Committee user is not assigned to any building', 'COMMITTEE_NO_BUILDING');
    }

    const query: any = {
      buildingId: committeeUser.buildingId,
    };

    if (filters.date) {
      query.date = filters.date.trim();
    } else if (filters.from || filters.to) {
      query.date = {};
      if (filters.from) query.date.$gte = filters.from.trim();
      if (filters.to) query.date.$lte = filters.to.trim();
    }

    return Attendance.find(query)
      .populate('guardId', 'name email phone employeeId designation')
      .populate('buildingId', 'name address')
      .sort({ checkIn: -1 });
  }
}
