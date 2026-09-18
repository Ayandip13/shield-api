import { Types } from 'mongoose';
import { EntryLog, IEntryLog, PersonType } from '../models/entryLog.model';
import { User } from '../models/user.model';
import { Building } from '../models/building.model';
import { ApiError } from '../utils/apiError';

import { NotificationService } from './notification.service';

export interface CreateEntryLogDto {
  personName: string;
  phone?: string;
  personType: PersonType;
  purpose?: string;
  flatUnit?: string;
  notes?: string;
}

export interface EntryLogFilters {
  buildingId?: string;
  guardId?: string;
  personType?: PersonType;
  date?: string;
  from?: string;
  to?: string;
  active?: string | boolean;
}

export interface ServiceAuthUser {
  id: string;
  role: string;
  providerId: Types.ObjectId | string;
  buildingId?: Types.ObjectId | string;
}

export class EntryLogService {
  /**
   * Helper to verify active guard status and building assignment
   */
  private static async verifyActiveGuard(guardUserId: string) {
    if (!Types.ObjectId.isValid(guardUserId)) {
      throw ApiError.badRequest('Invalid guard ID format', 'INVALID_ID');
    }
    const guard = await User.findById(guardUserId);
    if (!guard || guard.role !== 'guard') {
      throw ApiError.notFound('Guard record not found', 'GUARD_NOT_FOUND');
    }
    if (!guard.isActive) {
      throw ApiError.forbidden('Inactive guard account. Entry logging disabled.', 'GUARD_INACTIVE');
    }
    if (!guard.buildingId) {
      throw ApiError.badRequest('Guard is not assigned to any building', 'GUARD_NO_BUILDING');
    }
    return guard;
  }

  /**
   * Guard creates new Entry Log
   */
  static async createEntry(guardUserId: string, dto: CreateEntryLogDto): Promise<IEntryLog> {
    const guard = await this.verifyActiveGuard(guardUserId);

    if (!dto.personName || typeof dto.personName !== 'string' || !dto.personName.trim()) {
      throw ApiError.badRequest('Person name is required', 'MISSING_PERSON_NAME');
    }

    const validTypes: PersonType[] = ['visitor', 'delivery', 'staff', 'other'];
    if (!dto.personType || !validTypes.includes(dto.personType)) {
      throw ApiError.badRequest('Valid personType is required (visitor, delivery, staff, other)', 'INVALID_PERSON_TYPE');
    }

    const buildingId = guard.buildingId!;

    const entryLog = await EntryLog.create({
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

    const result = (await EntryLog.findById(entryLog._id)
      .populate('guardId', 'name employeeId designation')
      .populate('buildingId', 'name address'))!;

    const bName = result.buildingId && typeof result.buildingId === 'object' && 'name' in result.buildingId
      ? (result.buildingId as any).name
      : 'Assigned Building';

    NotificationService.createNotification({
      providerId: guard.providerId,
      buildingId: buildingId,
      type: 'entry_exit',
      title: 'New Visitor Entry',
      message: `A ${dto.personType} entry was recorded at ${bName}.`,
      relatedEntityType: 'EntryLog',
      relatedEntityId: entryLog._id,
    });

    return result;
  }

  /**
   * Guard marks entry as exited (Conditional update to prevent exit race conditions)
   */
  static async markExit(guardUserId: string, entryLogId: string): Promise<IEntryLog> {
    const guard = await this.verifyActiveGuard(guardUserId);

    if (!Types.ObjectId.isValid(entryLogId)) {
      throw ApiError.badRequest('Invalid entry log ID format', 'INVALID_ID');
    }

    const log = await EntryLog.findById(entryLogId);
    if (!log) {
      throw ApiError.notFound('Entry log record not found', 'ENTRY_LOG_NOT_FOUND');
    }

    const guardBuildingId = guard.buildingId!.toString();

    // Security check: Must belong to same provider and building
    if (
      log.providerId.toString() !== guard.providerId.toString() ||
      log.buildingId.toString() !== guardBuildingId
    ) {
      throw ApiError.forbidden('Access denied. Entry log belongs to another building.', 'BUILDING_ACCESS_DENIED');
    }

    // Conditional atomic exit update
    const updatedLog = await EntryLog.findOneAndUpdate(
      {
        _id: log._id,
        exitTime: null,
      },
      {
        $set: { exitTime: new Date() },
      },
      { new: true }
    );

    if (!updatedLog) {
      throw ApiError.badRequest('Entry record has already been marked as exited.', 'ALREADY_EXITED');
    }

    return (await EntryLog.findById(updatedLog._id)
      .populate('guardId', 'name employeeId designation')
      .populate('buildingId', 'name address'))!;
  }

  /**
   * Get active entries currently inside (exitTime == null)
   */
  static async getActiveEntries(
    user: ServiceAuthUser,
    buildingIdFilter?: string
  ): Promise<IEntryLog[]> {
    const query: any = { exitTime: null };
    const providerIdStr = user.providerId.toString();

    if (user.role === 'guard' || user.role === 'committee') {
      if (!user.buildingId) {
        throw ApiError.badRequest('User is not assigned to a building', 'NO_BUILDING_ASSIGNMENT');
      }
      query.buildingId = new Types.ObjectId(user.buildingId.toString());
    } else if (user.role === 'provider_admin') {
      query.providerId = new Types.ObjectId(providerIdStr);
      if (buildingIdFilter) {
        if (!Types.ObjectId.isValid(buildingIdFilter)) {
          throw ApiError.badRequest('Invalid building ID format', 'INVALID_ID');
        }
        const building = await Building.findById(buildingIdFilter);
        if (!building || building.providerId.toString() !== providerIdStr) {
          throw ApiError.forbidden('Access denied. Building does not belong to your provider.', 'PROVIDER_ACCESS_DENIED');
        }
        query.buildingId = new Types.ObjectId(buildingIdFilter);
      }
    }

    return EntryLog.find(query)
      .populate('guardId', 'name employeeId designation')
      .populate('buildingId', 'name address')
      .sort({ entryTime: -1 });
  }

  /**
   * Get historical entry logs with filtering & tenant scoping
   */
  static async getEntryLogs(
    user: ServiceAuthUser,
    filters: EntryLogFilters
  ): Promise<IEntryLog[]> {
    const query: any = {};
    const providerIdStr = user.providerId.toString();

    if (user.role === 'guard' || user.role === 'committee') {
      if (!user.buildingId) {
        throw ApiError.badRequest('User is not assigned to a building', 'NO_BUILDING_ASSIGNMENT');
      }
      query.buildingId = new Types.ObjectId(user.buildingId.toString());
    } else if (user.role === 'provider_admin') {
      query.providerId = new Types.ObjectId(providerIdStr);

      if (filters.buildingId) {
        if (!Types.ObjectId.isValid(filters.buildingId)) {
          throw ApiError.badRequest('Invalid building ID format', 'INVALID_ID');
        }
        const building = await Building.findById(filters.buildingId);
        if (!building || building.providerId.toString() !== providerIdStr) {
          throw ApiError.forbidden('Access denied. Building does not belong to your provider.', 'PROVIDER_ACCESS_DENIED');
        }
        query.buildingId = new Types.ObjectId(filters.buildingId);
      }

      if (filters.guardId) {
        if (!Types.ObjectId.isValid(filters.guardId)) {
          throw ApiError.badRequest('Invalid guard ID format', 'INVALID_ID');
        }
        query.guardId = new Types.ObjectId(filters.guardId);
      }
    }

    if (filters.personType) {
      query.personType = filters.personType;
    }

    if (filters.active === 'true' || filters.active === true) {
      query.exitTime = null;
    } else if (filters.active === 'false' || filters.active === false) {
      query.exitTime = { $ne: null };
    }

    if (filters.date) {
      const dayStart = new Date(`${filters.date.trim()}T00:00:00.000Z`);
      const dayEnd = new Date(`${filters.date.trim()}T23:59:59.999Z`);
      query.entryTime = { $gte: dayStart, $lte: dayEnd };
    } else if (filters.from || filters.to) {
      query.entryTime = {};
      if (filters.from) query.entryTime.$gte = new Date(`${filters.from.trim()}T00:00:00.000Z`);
      if (filters.to) query.entryTime.$lte = new Date(`${filters.to.trim()}T23:59:59.999Z`);
    }

    return EntryLog.find(query)
      .populate('guardId', 'name employeeId designation')
      .populate('buildingId', 'name address')
      .sort({ entryTime: -1 })
      .limit(100);
  }

  /**
   * Get single Entry Log by ID with tenant verification
   */
  static async getEntryLogById(
    user: ServiceAuthUser,
    entryLogId: string
  ): Promise<IEntryLog> {
    if (!Types.ObjectId.isValid(entryLogId)) {
      throw ApiError.badRequest('Invalid entry log ID format', 'INVALID_ID');
    }

    const log = await EntryLog.findById(entryLogId)
      .populate('guardId', 'name employeeId designation phone email')
      .populate('buildingId', 'name address contactPhone');

    if (!log) {
      throw ApiError.notFound('Entry log record not found', 'ENTRY_LOG_NOT_FOUND');
    }

    if (user.role === 'guard' || user.role === 'committee') {
      if (!user.buildingId || log.buildingId._id.toString() !== user.buildingId.toString()) {
        throw ApiError.forbidden('Access denied. Entry log belongs to another building.', 'BUILDING_ACCESS_DENIED');
      }
    } else if (user.role === 'provider_admin') {
      if (log.providerId.toString() !== user.providerId.toString()) {
        throw ApiError.forbidden('Access denied. Entry log belongs to another provider.', 'PROVIDER_ACCESS_DENIED');
      }
    }

    return log;
  }
}
