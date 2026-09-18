import { Request, Response, NextFunction } from 'express';
import {
  getUserProfile,
  updateUserProfile,
  changeUserPassword,
  UpdateProfileDto,
} from '../services/profile.service';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';

export async function getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw ApiError.unauthorized('Authentication token required.', 'UNAUTHORIZED');
    }

    const profile = await getUserProfile(userId);
    ApiResponse.success(res, 200, 'Profile retrieved successfully', profile);
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw ApiError.unauthorized('Authentication token required.', 'UNAUTHORIZED');
    }

    const dto: UpdateProfileDto = {
      name: req.body.name,
      phone: req.body.phone,
    };

    const updatedProfile = await updateUserProfile(userId, dto);
    ApiResponse.success(res, 200, 'Profile updated successfully', updatedProfile);
  } catch (error) {
    next(error);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw ApiError.unauthorized('Authentication token required.', 'UNAUTHORIZED');
    }

    const { currentPassword, newPassword } = req.body;
    const result = await changeUserPassword(userId, currentPassword, newPassword);
    ApiResponse.success(res, 200, result.message);
  } catch (error) {
    next(error);
  }
}
