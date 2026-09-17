import { Request, Response, NextFunction } from 'express';
import { ShiftService } from '../services/shift.service';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';

export async function getGuardShift(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const targetGuardId = req.params.guardId as string;

    if (req.user!.role === 'guard') {
      // Guard can only inspect their own shift
      if (req.user!.id !== targetGuardId) {
        throw ApiError.forbidden('Guards can only view their own shift schedule', 'FORBIDDEN_ACCESS');
      }
      const shift = await ShiftService.getGuardShift(targetGuardId);
      ApiResponse.success(res, 200, 'Shift retrieved successfully', shift);
      return;
    }

    if (req.user!.role === 'provider_admin') {
      const providerId = req.user!.providerId.toString();
      const shift = await ShiftService.getGuardShift(targetGuardId, providerId);
      ApiResponse.success(res, 200, 'Guard shift retrieved successfully', shift);
      return;
    }

    throw ApiError.forbidden('Unauthorized to view guard shift', 'FORBIDDEN_ROLE');
  } catch (error) {
    next(error);
  }
}

export async function updateGuardShift(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const guardId = req.params.guardId as string;
    const providerId = req.user!.providerId.toString();
    const { startTime, endTime } = req.body;

    if (!startTime || !endTime) {
      throw ApiError.badRequest('Both startTime and endTime are required', 'MISSING_SHIFT_TIMES');
    }

    const updatedShift = await ShiftService.updateGuardShift(guardId, providerId, startTime, endTime);
    ApiResponse.success(res, 200, 'Guard shift updated successfully', updatedShift);
  } catch (error) {
    next(error);
  }
}
