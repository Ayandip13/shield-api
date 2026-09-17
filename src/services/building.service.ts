import { Types } from 'mongoose';
import { Building, IBuilding } from '../models/building.model';
import { ApiError } from '../utils/apiError';

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
  /**
   * List all buildings belonging to a specific provider
   */
  static async getBuildingsByProvider(providerId: string): Promise<IBuilding[]> {
    if (!Types.ObjectId.isValid(providerId)) {
      throw ApiError.badRequest('Invalid provider ID format', 'INVALID_ID');
    }
    return Building.find({ providerId: new Types.ObjectId(providerId) }).sort({ createdAt: -1 });
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
    return building;
  }
}
