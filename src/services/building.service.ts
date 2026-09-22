import { Types } from 'mongoose';
import { Building, IBuilding } from '../models/building.model';
import { ApiError } from '../utils/apiError';
import { NotificationService } from './notification.service';

export interface CreateBuildingDto {
  name: string;
  address: string;
  contactPhone?: string;
  contactEmail?: string;
}

export interface UpdateBuildingDto {
  name?: string;
  address?: string;
  contactPhone?: string;
  contactEmail?: string;
}

export class BuildingService {
  static async getBuildingsByProvider(
    providerId: string,
    page?: number,
    limit?: number
  ): Promise<IBuilding[]> {
    if (!Types.ObjectId.isValid(providerId)) {
      throw ApiError.badRequest('Invalid provider ID format', 'INVALID_ID');
    }

    const query = Building.find({ providerId: new Types.ObjectId(providerId) }).sort({ createdAt: -1 });

    if (page && limit) {
      const safePage = Math.max(1, page);
      const safeLimit = Math.min(100, Math.max(1, limit));
      query.skip((safePage - 1) * safeLimit).limit(safeLimit);
    }

    return query;
  }

  /**
   * Get a single building with strict tenant isolation check
   */
  static async getBuildingById(buildingId: string, providerId: string): Promise<IBuilding> {
    if (!Types.ObjectId.isValid(buildingId)) {
      throw ApiError.badRequest('Invalid building ID format', 'INVALID_ID');
    }

    const building = await Building.findById(buildingId);
    if (!building) {
      throw ApiError.notFound('Building record not found', 'BUILDING_NOT_FOUND');
    }

    // Strict tenant isolation enforcement
    if (building.providerId.toString() !== providerId.toString()) {
      throw ApiError.forbidden(
        'Access denied. Building belongs to another security provider.',
        'PROVIDER_ACCESS_DENIED'
      );
    }

    return building;
  }

  /**
   * Create a new building for the authenticated provider
   */
  static async createBuilding(providerId: string, dto: CreateBuildingDto): Promise<IBuilding> {
    if (!Types.ObjectId.isValid(providerId)) {
      throw ApiError.badRequest('Invalid provider ID format', 'INVALID_ID');
    }

    const building = await Building.create({
      providerId: new Types.ObjectId(providerId),
      name: dto.name,
      address: dto.address,
      contactPhone: dto.contactPhone || undefined,
      contactEmail: dto.contactEmail || undefined,
      isActive: true,
    });

    NotificationService.createNotification({
      providerId,
      buildingId: building._id,
      type: 'building',
      title: 'Building Created',
      message: `New building '${dto.name}' was registered.`,
      relatedEntityType: 'Building',
      relatedEntityId: building._id,
    });

    return building;
  }

  /**
   * Update building details for the authenticated provider
   */
  static async updateBuilding(
    buildingId: string,
    providerId: string,
    dto: UpdateBuildingDto
  ): Promise<IBuilding> {
    const building = await this.getBuildingById(buildingId, providerId);

    if (dto.name !== undefined) building.name = dto.name;
    if (dto.address !== undefined) building.address = dto.address;
    if (dto.contactPhone !== undefined) building.contactPhone = dto.contactPhone;
    if (dto.contactEmail !== undefined) building.contactEmail = dto.contactEmail;

    await building.save();
    return building;
  }

  /**
   * Activate or deactivate building status (soft status toggle)
   */
  static async updateBuildingStatus(
    buildingId: string,
    providerId: string,
    isActive: boolean
  ): Promise<IBuilding> {
    const building = await this.getBuildingById(buildingId, providerId);
    building.isActive = isActive;
    await building.save();

    NotificationService.createNotification({
      providerId,
      buildingId: building._id,
      type: 'building',
      title: 'Building Status Updated',
      message: `Building '${building.name}' status set to ${isActive ? 'active' : 'inactive'}.`,
      relatedEntityType: 'Building',
      relatedEntityId: building._id,
    });

    return building;
  }

  /**
   * Delete a building by ID
   */
  static async deleteBuilding(buildingId: string, providerId: string): Promise<void> {
    const building = await this.getBuildingById(buildingId, providerId);
    await Building.deleteOne({ _id: building._id });

    NotificationService.createNotification({
      providerId,
      buildingId: building._id,
      type: 'building',
      title: 'Building Deleted',
      message: `Building '${building.name}' was deleted.`,
      relatedEntityType: 'Building',
      relatedEntityId: building._id,
    });
  }
}
