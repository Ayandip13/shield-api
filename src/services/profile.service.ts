import { User, RefreshToken } from '../models';
import '../models/provider.model';
import '../models/building.model';
import { ApiError } from '../utils/apiError';

export interface UpdateProfileDto {
  name?: string;
  phone?: string;
}

export async function getUserProfile(userId: string) {
  const user = await User.findById(userId)
    .populate('providerId', 'name')
    .populate('buildingId', 'name address')
    .lean();

  if (!user || !user.isActive) {
    throw ApiError.unauthorized('User account not found or deactivated.', 'USER_INACTIVE');
  }

  const baseProfile = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone || null,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  if (user.role === 'guard') {
    const buildingObj =
      user.buildingId && typeof user.buildingId === 'object' && 'name' in user.buildingId
        ? {
            id: (user.buildingId as any)._id.toString(),
            name: (user.buildingId as any).name,
            address: (user.buildingId as any).address,
          }
        : null;

    return {
      ...baseProfile,
      employeeId: user.employeeId || null,
      designation: user.designation || 'Security Guard',
      joiningDate: user.joiningDate || null,
      monthlySalary: user.monthlySalary !== undefined && user.monthlySalary !== null ? user.monthlySalary : null,
      building: buildingObj,
    };
  }

  if (user.role === 'committee') {
    const buildingObj =
      user.buildingId && typeof user.buildingId === 'object' && 'name' in user.buildingId
        ? {
            id: (user.buildingId as any)._id.toString(),
            name: (user.buildingId as any).name,
            address: (user.buildingId as any).address,
          }
        : null;

    return {
      ...baseProfile,
      designation: user.designation || 'Committee Member',
      building: buildingObj,
    };
  }

  if (user.role === 'provider_admin') {
    const providerObj =
      user.providerId && typeof user.providerId === 'object' && 'name' in user.providerId
        ? {
            id: (user.providerId as any)._id.toString(),
            name: (user.providerId as any).name,
          }
        : null;

    return {
      ...baseProfile,
      provider: providerObj,
    };
  }

  return baseProfile;
}

export async function updateUserProfile(userId: string, data: UpdateProfileDto) {
  const user = await User.findById(userId);

  if (!user || !user.isActive) {
    throw ApiError.unauthorized('User account not found or deactivated.', 'USER_INACTIVE');
  }

  if (data.name !== undefined) {
    const trimmedName = data.name.trim();
    if (!trimmedName) {
      throw ApiError.badRequest('Name cannot be empty.', 'INVALID_INPUT');
    }
    user.name = trimmedName;
  }

  if (data.phone !== undefined) {
    user.phone = data.phone ? data.phone.trim() : undefined;
  }

  await user.save();

  return getUserProfile(userId);
}

export async function changeUserPassword(
  userId: string,
  currentPassword?: string,
  newPassword?: string
) {
  if (!currentPassword || !newPassword) {
    throw ApiError.badRequest('Current password and new password are required.', 'MISSING_FIELDS');
  }

  if (newPassword.length < 8) {
    throw ApiError.badRequest('New password must be at least 8 characters long.', 'WEAK_PASSWORD');
  }

  const user = await User.findById(userId).select('+passwordHash');

  if (!user || !user.isActive) {
    throw ApiError.unauthorized('User account not found or deactivated.', 'USER_INACTIVE');
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw ApiError.badRequest('Current password is incorrect.', 'INVALID_CURRENT_PASSWORD');
  }

  user.passwordHash = newPassword;
  await user.save();

  // Revoke all active refresh sessions for security on password change
  await RefreshToken.updateMany(
    { userId: user._id, revokedAt: null },
    { revokedAt: new Date() }
  );

  return { message: 'Password changed successfully.' };
}
