import { Types } from 'mongoose';
import { AuthUser } from '../types/express';
import { ApiError } from './apiError';
import { Building } from '../models/building.model';

export async function validateBuildingAccess(
  user: AuthUser,
  targetBuildingId: string | Types.ObjectId
): Promise<boolean> {
  const targetIdStr = targetBuildingId.toString();

  // Committee and Guard roles are strictly scoped to their assigned buildingId
  if (user.role === 'committee' || user.role === 'guard') {
    const userBuildingIdStr = user.buildingId ? user.buildingId.toString() : '';
    if (userBuildingIdStr !== targetIdStr) {
      throw ApiError.forbidden(
        'Access denied. You can only access resources associated with your assigned building.',
        'BUILDING_ACCESS_DENIED'
      );
    }
    return true;
  }

  // Provider admins can access any building belonging to their provider
  if (user.role === 'provider_admin') {
    const building = await Building.findById(targetBuildingId);
    if (!building) {
      throw ApiError.notFound('Building not found.', 'BUILDING_NOT_FOUND');
    }
    if (building.providerId.toString() !== user.providerId.toString()) {
      throw ApiError.forbidden(
        'Access denied. This building does not belong to your security provider.',
        'PROVIDER_ACCESS_DENIED'
      );
    }
    return true;
  }

  throw ApiError.forbidden('Unauthorized access.', 'ACCESS_DENIED');
}
