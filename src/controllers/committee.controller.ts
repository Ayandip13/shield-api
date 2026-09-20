import { Request, Response, NextFunction } from 'express';
import { CommitteeService } from '../services/committee.service';
import { RefreshToken } from '../models/refreshToken.model';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+0-9\s\-()]{5,20}$/;

export async function getCommitteeMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const providerId = req.user!.providerId.toString();
    const buildingId = req.query.buildingId ? (req.query.buildingId as string) : undefined;
    const members = await CommitteeService.getCommitteeMembers(providerId, buildingId);
    ApiResponse.success(res, 200, 'Committee members list retrieved successfully', members);
  } catch (error) {
    next(error);
  }
}

export async function getCommitteeMemberById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const providerId = req.user!.providerId.toString();
    const member = await CommitteeService.getCommitteeMemberById(id, providerId);
    ApiResponse.success(res, 200, 'Committee member retrieved successfully', member);
  } catch (error) {
    next(error);
  }
}

export async function createCommitteeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const providerId = req.user!.providerId.toString();
    const { name, email, phone, password, buildingId } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      throw ApiError.badRequest('Committee member name is required', 'MISSING_NAME');
    }
    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim().toLowerCase())) {
      throw ApiError.badRequest('Valid email address is required', 'INVALID_EMAIL');
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      throw ApiError.badRequest('Password is required and must be at least 6 characters', 'INVALID_PASSWORD');
    }
    if (!buildingId || typeof buildingId !== 'string') {
      throw ApiError.badRequest('Target buildingId is required', 'MISSING_BUILDING');
    }

    if (phone && (typeof phone !== 'string' || !PHONE_REGEX.test(phone.trim()))) {
      throw ApiError.badRequest('Invalid phone format', 'INVALID_PHONE');
    }

    const member = await CommitteeService.createCommitteeMember(providerId, {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : undefined,
      password,
      buildingId,
    });

    ApiResponse.success(res, 201, 'Committee member created successfully', member);
  } catch (error) {
    next(error);
  }
}

export async function updateCommitteeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const providerId = req.user!.providerId.toString();
    const { name, phone, buildingId } = req.body;

    if (req.body.role || req.body.providerId || req.body.password || req.body.passwordHash) {
      throw ApiError.badRequest('Updating role, providerId, or password via this route is prohibited', 'RESTRICTED_FIELD');
    }

    if (name !== undefined && (!name || typeof name !== 'string' || !name.trim())) {
      throw ApiError.badRequest('Committee member name cannot be empty', 'INVALID_NAME');
    }

    if (phone !== undefined && phone !== null && phone !== '') {
      if (typeof phone !== 'string' || !PHONE_REGEX.test(phone.trim())) {
        throw ApiError.badRequest('Invalid phone format', 'INVALID_PHONE');
      }
    }

    const updatedMember = await CommitteeService.updateCommitteeMember(id, providerId, {
      name: name ? name.trim() : undefined,
      phone: phone !== undefined ? (phone ? phone.trim() : '') : undefined,
      buildingId: buildingId ? String(buildingId) : undefined,
    });

    ApiResponse.success(res, 200, 'Committee member updated successfully', updatedMember);
  } catch (error) {
    next(error);
  }
}

export async function updateCommitteeStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const providerId = req.user!.providerId.toString();
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      throw ApiError.badRequest('isActive must be a boolean value', 'INVALID_STATUS');
    }

    const member = await CommitteeService.updateCommitteeStatus(id, providerId, isActive);
    if (!isActive) {
      await RefreshToken.updateMany(
        { userId: id, revokedAt: null },
        { revokedAt: new Date() }
      );
    }
    ApiResponse.success(res, 200, `Committee member status updated to ${isActive ? 'active' : 'inactive'}`, member);
  } catch (error) {
    next(error);
  }
}

export async function getCommitteeMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const memberProfile = await CommitteeService.getCommitteeMe(userId);
    ApiResponse.success(res, 200, 'Committee member profile retrieved successfully', memberProfile);
  } catch (error) {
    next(error);
  }
}
