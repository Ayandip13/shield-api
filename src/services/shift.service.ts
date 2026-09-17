import { Types } from 'mongoose';
import { Shift, IShift } from '../models/shift.model';
import { User } from '../models/user.model';
import { Building } from '../models/building.model';
import { ApiError } from '../utils/apiError';
import { isValidTimeString } from '../utils/date.util';

export class ShiftService {
  /**
   * Helper to verify guard exists and belongs to the provider
   */
  private static async getGuardAndVerifyOwnership(guardId: string, providerId: string) {
    if (!Types.ObjectId.isValid(guardId)) {
      throw ApiError.badRequest('Invalid guard ID format', 'INVALID_ID');
    }
    const guard = await User.findOne({ _id: guardId, role: 'guard' });
    if (!guard) {
      throw ApiError.notFound('Guard record not found', 'GUARD_NOT_FOUND');
    }
    if (guard.providerId.toString() !== providerId.toString()) {
      throw ApiError.forbidden('Access denied. Guard does not belong to your provider.', 'PROVIDER_ACCESS_DENIED');
    }
    if (!guard.buildingId) {
      throw ApiError.badRequest('Guard is not assigned to any building', 'GUARD_NO_BUILDING');
    }
    return guard;
  }

  /**
   * Get guard's default shift configuration
   */
  static async getGuardShift(guardId: string, providerId?: string): Promise<any> {
    if (!Types.ObjectId.isValid(guardId)) {
      throw ApiError.badRequest('Invalid guard ID format', 'INVALID_ID');
    }

    const guard = await User.findOne({ _id: guardId, role: 'guard' }).populate('buildingId', 'name address');
    if (!guard) {
      throw ApiError.notFound('Guard record not found', 'GUARD_NOT_FOUND');
    }

    if (providerId && guard.providerId.toString() !== providerId.toString()) {
      throw ApiError.forbidden('Access denied. Guard does not belong to your provider.', 'PROVIDER_ACCESS_DENIED');
    }

    const existingShift = await Shift.findOne({ guardId: new Types.ObjectId(guardId) });

    if (existingShift) {
      return existingShift;
    }

    // Return default shift structure if not yet custom configured
    return {
      guardId: guard._id,
      buildingId: guard.buildingId,
      providerId: guard.providerId,
      startTime: '08:00',
      endTime: '20:00',
      isActive: true,
      isDefaultFallback: true,
    };
  }

  /**
   * Upsert guard's default shift schedule (Provider Admin only)
   */
  static async updateGuardShift(
    guardId: string,
    providerId: string,
    startTime: string,
    endTime: string
  ): Promise<IShift> {
    const guard = await this.getGuardAndVerifyOwnership(guardId, providerId);

    if (!isValidTimeString(startTime)) {
      throw ApiError.badRequest('Invalid start time format. Use HH:mm (e.g. 08:00)', 'INVALID_START_TIME');
    }

    if (!isValidTimeString(endTime)) {
      throw ApiError.badRequest('Invalid end time format. Use HH:mm (e.g. 20:00)', 'INVALID_END_TIME');
    }

    // Verify building belongs to provider
    const building = await Building.findById(guard.buildingId);
    if (!building || building.providerId.toString() !== providerId.toString()) {
      throw ApiError.forbidden('Guard assigned building does not belong to provider', 'BUILDING_MISMATCH');
    }

    const shift = await Shift.findOneAndUpdate(
      { guardId: guard._id },
      {
        guardId: guard._id,
        buildingId: guard.buildingId,
        providerId: guard.providerId,
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        isActive: true,
      },
      { upsert: true, new: true, runValidators: true }
    );

    return shift;
  }
}
