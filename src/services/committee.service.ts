import { Types } from 'mongoose';
import { User, IUser } from '../models/user.model';
import { Building } from '../models/building.model';
import { ApiError } from '../utils/apiError';

export interface CreateCommitteeDto {
  name: string;
  email: string;
  phone?: string;
  password: string;
  buildingId: string;
}

export interface UpdateCommitteeDto {
  name?: string;
  phone?: string;
  buildingId?: string;
}

export class CommitteeService {
  /**
   * Helper to verify building ownership for provider
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

  static async getCommitteeMembers(
    providerId: string,
    buildingId?: string,
    page?: number,
    limit?: number
  ): Promise<IUser[]> {
    if (!Types.ObjectId.isValid(providerId)) {
      throw ApiError.badRequest('Invalid provider ID format', 'INVALID_ID');
    }

    const queryFilter: any = {
      role: 'committee',
      providerId: new Types.ObjectId(providerId),
    };

    if (buildingId) {
      await this.verifyBuildingOwnership(buildingId, providerId);
      queryFilter.buildingId = new Types.ObjectId(buildingId);
    }

    const query = User.find(queryFilter)
      .populate('buildingId', 'name address contactPhone contactEmail')
      .sort({ createdAt: -1 });

    if (page && limit) {
      const safePage = Math.max(1, page);
      const safeLimit = Math.min(100, Math.max(1, limit));
      query.skip((safePage - 1) * safeLimit).limit(safeLimit);
    }

    return query;
  }

  /**
   * Get single committee member by ID
   */
  static async getCommitteeMemberById(memberId: string, providerId: string): Promise<IUser> {
    if (!Types.ObjectId.isValid(memberId)) {
      throw ApiError.badRequest('Invalid committee member ID format', 'INVALID_ID');
    }

    const member = await User.findOne({ _id: memberId, role: 'committee' }).populate(
      'buildingId',
      'name address contactPhone contactEmail'
    );

    if (!member) {
      throw ApiError.notFound('Committee member record not found', 'MEMBER_NOT_FOUND');
    }

    if (member.providerId.toString() !== providerId.toString()) {
      throw ApiError.forbidden(
        'Access denied. Committee member does not belong to your security provider.',
        'PROVIDER_ACCESS_DENIED'
      );
    }

    return member;
  }

  /**
   * Create committee member account
   */
  static async createCommitteeMember(providerId: string, dto: CreateCommitteeDto): Promise<IUser> {
    await this.verifyBuildingOwnership(dto.buildingId, providerId);

    const existingUser = await User.findOne({ email: dto.email.toLowerCase() });
    if (existingUser) {
      throw ApiError.badRequest('A user with this email address already exists.', 'DUPLICATE_EMAIL');
    }

    const member = await User.create({
      name: dto.name,
      email: dto.email.toLowerCase(),
      phone: dto.phone || undefined,
      passwordHash: dto.password,
      role: 'committee',
      providerId: new Types.ObjectId(providerId),
      buildingId: new Types.ObjectId(dto.buildingId),
      isActive: true,
    });

    const populatedMember = await User.findById(member._id).populate(
      'buildingId',
      'name address contactPhone contactEmail'
    );
    return populatedMember!;
  }

  /**
   * Update committee member details
   */
  static async updateCommitteeMember(
    memberId: string,
    providerId: string,
    dto: UpdateCommitteeDto
  ): Promise<IUser> {
    const member = await this.getCommitteeMemberById(memberId, providerId);

    if (dto.buildingId) {
      await this.verifyBuildingOwnership(dto.buildingId, providerId);
      member.buildingId = new Types.ObjectId(dto.buildingId);
    }

    if (dto.name !== undefined) member.name = dto.name;
    if (dto.phone !== undefined) member.phone = dto.phone;

    await member.save();
    return (await User.findById(member._id).populate(
      'buildingId',
      'name address contactPhone contactEmail'
    ))!;
  }

  /**
   * Update committee member status
   */
  static async updateCommitteeStatus(
    memberId: string,
    providerId: string,
    isActive: boolean
  ): Promise<IUser> {
    const member = await this.getCommitteeMemberById(memberId, providerId);
    member.isActive = isActive;
    await member.save();
    return member;
  }

  /**
   * Get authenticated committee user's own profile and building information
   */
  static async getCommitteeMe(userId: string): Promise<IUser> {
    const member = await User.findOne({ _id: userId, role: 'committee' }).populate(
      'buildingId',
      'name address contactPhone contactEmail'
    );

    if (!member) {
      throw ApiError.notFound('Committee member profile not found', 'MEMBER_NOT_FOUND');
    }

    return member;
  }
}
