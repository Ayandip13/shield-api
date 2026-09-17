import { Types } from 'mongoose';
import { User, IUser } from '../models/user.model';
import { Building } from '../models/building.model';
import { ApiError } from '../utils/apiError';

export interface CreateGuardDto {
  name: string;
  email: string;
  phone?: string;
  password: string;
  buildingId: string;
  employeeId?: string;
  joiningDate?: string | Date;
  monthlySalary?: number;
  designation?: string;
}

export interface UpdateGuardDto {
  name?: string;
  phone?: string;
  employeeId?: string;
  joiningDate?: string | Date;
  monthlySalary?: number;
  designation?: string;
  buildingId?: string;
}

export class GuardService {
  /**
   * Helper to verify if a building belongs to the provider
   */
  private static async verifyBuildingOwnership(buildingId: string, providerId: string): Promise<void> {
    if (!Types.ObjectId.isValid(buildingId)) {
      throw ApiError.badRequest('Invalid building ID format', 'INVALID_ID');
    }
    const building = await Building.findById(buildingId);
    if (!building) {
      throw ApiError.notFound('Assigned building record not found', 'BUILDING_NOT_FOUND');
    }
    if (building.providerId.toString() !== providerId.toString()) {
      throw ApiError.forbidden(
        'Access denied. Building does not belong to your security provider.',
        'PROVIDER_ACCESS_DENIED'
      );
    }
  }

  /**
   * List all guards for a provider with optional building filter
   */
  static async getGuards(providerId: string, buildingId?: string): Promise<IUser[]> {
    if (!Types.ObjectId.isValid(providerId)) {
      throw ApiError.badRequest('Invalid provider ID format', 'INVALID_ID');
    }

    const query: any = {
      role: 'guard',
      providerId: new Types.ObjectId(providerId),
    };

    if (buildingId) {
      await this.verifyBuildingOwnership(buildingId, providerId);
      query.buildingId = new Types.ObjectId(buildingId);
    }

    return User.find(query)
      .populate('buildingId', 'name address contactPhone contactEmail')
      .sort({ createdAt: -1 });
  }

  /**
   * Get a single guard by ID with tenant security check
   */
  static async getGuardById(guardId: string, providerId: string): Promise<IUser> {
    if (!Types.ObjectId.isValid(guardId)) {
      throw ApiError.badRequest('Invalid guard ID format', 'INVALID_ID');
    }

    const guard = await User.findOne({ _id: guardId, role: 'guard' }).populate(
      'buildingId',
      'name address contactPhone contactEmail'
    );

    if (!guard) {
      throw ApiError.notFound('Guard record not found', 'GUARD_NOT_FOUND');
    }

    if (guard.providerId.toString() !== providerId.toString()) {
      throw ApiError.forbidden(
        'Access denied. Guard does not belong to your security provider.',
        'PROVIDER_ACCESS_DENIED'
      );
    }

    return guard;
  }

  /**
   * Create a new Guard user
   */
  static async createGuard(providerId: string, dto: CreateGuardDto): Promise<IUser> {
    await this.verifyBuildingOwnership(dto.buildingId, providerId);

    const existingUser = await User.findOne({ email: dto.email.toLowerCase() });
    if (existingUser) {
      throw ApiError.badRequest('A user with this email address already exists.', 'DUPLICATE_EMAIL');
    }

    const guard = await User.create({
      name: dto.name,
      email: dto.email.toLowerCase(),
      phone: dto.phone || undefined,
      passwordHash: dto.password,
      role: 'guard',
      providerId: new Types.ObjectId(providerId),
      buildingId: new Types.ObjectId(dto.buildingId),
      employeeId: dto.employeeId || undefined,
      joiningDate: dto.joiningDate ? new Date(dto.joiningDate) : undefined,
      monthlySalary: dto.monthlySalary !== undefined ? dto.monthlySalary : undefined,
      designation: dto.designation || undefined,
      isActive: true,
    });

    const populatedGuard = await User.findById(guard._id).populate(
      'buildingId',
      'name address contactPhone contactEmail'
    );
    return populatedGuard!;
  }

  /**
   * Update guard details
   */
  static async updateGuard(
    guardId: string,
    providerId: string,
    dto: UpdateGuardDto
  ): Promise<IUser> {
    const guard = await this.getGuardById(guardId, providerId);

    if (dto.buildingId) {
      await this.verifyBuildingOwnership(dto.buildingId, providerId);
      guard.buildingId = new Types.ObjectId(dto.buildingId);
    }

    if (dto.name !== undefined) guard.name = dto.name;
    if (dto.phone !== undefined) guard.phone = dto.phone;
    if (dto.employeeId !== undefined) guard.employeeId = dto.employeeId;
    if (dto.joiningDate !== undefined) {
      guard.joiningDate = dto.joiningDate ? new Date(dto.joiningDate) : undefined;
    }
    if (dto.monthlySalary !== undefined) guard.monthlySalary = dto.monthlySalary;
    if (dto.designation !== undefined) guard.designation = dto.designation;

    await guard.save();
    return (await User.findById(guard._id).populate(
      'buildingId',
      'name address contactPhone contactEmail'
    ))!;
  }

  /**
   * Update guard status (soft activate/deactivate)
   */
  static async updateGuardStatus(
    guardId: string,
    providerId: string,
    isActive: boolean
  ): Promise<IUser> {
    const guard = await this.getGuardById(guardId, providerId);
    guard.isActive = isActive;
    await guard.save();
    return guard;
  }

  /**
   * Get authenticated guard's own profile and assigned building details
   */
  static async getGuardMe(userId: string): Promise<IUser> {
    const guard = await User.findOne({ _id: userId, role: 'guard' }).populate(
      'buildingId',
      'name address contactPhone contactEmail'
    );

    if (!guard) {
      throw ApiError.notFound('Guard profile not found', 'GUARD_NOT_FOUND');
    }

    return guard;
  }
}
