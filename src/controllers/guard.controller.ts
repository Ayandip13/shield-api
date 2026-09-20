import { Request, Response, NextFunction } from 'express';
import { GuardService } from '../services/guard.service';
import { RefreshToken } from '../models/refreshToken.model';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+0-9\s\-()]{5,20}$/;

export async function getGuards(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const providerId = req.user!.providerId.toString();
    const buildingId = req.query.buildingId ? (req.query.buildingId as string) : undefined;
    const guards = await GuardService.getGuards(providerId, buildingId);
    ApiResponse.success(res, 200, 'Guards list retrieved successfully', guards);
  } catch (error) {
    next(error);
  }
}

export async function getGuardById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const providerId = req.user!.providerId.toString();
    const guard = await GuardService.getGuardById(id, providerId);
    ApiResponse.success(res, 200, 'Guard retrieved successfully', guard);
  } catch (error) {
    next(error);
  }
}

export async function createGuard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const providerId = req.user!.providerId.toString();
    const { name, email, phone, password, buildingId, employeeId, joiningDate, monthlySalary, designation } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      throw ApiError.badRequest('Guard name is required', 'MISSING_NAME');
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

    let parsedSalary: number | undefined;
    if (monthlySalary !== undefined && monthlySalary !== null && monthlySalary !== '') {
      parsedSalary = Number(monthlySalary);
      if (isNaN(parsedSalary) || parsedSalary < 0) {
        throw ApiError.badRequest('Monthly salary must be a valid non-negative number', 'INVALID_SALARY');
      }
    }

    const guard = await GuardService.createGuard(providerId, {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : undefined,
      password,
      buildingId,
      employeeId: employeeId ? String(employeeId).trim() : undefined,
      joiningDate: joiningDate || undefined,
      monthlySalary: parsedSalary,
      designation: designation ? String(designation).trim() : undefined,
    });

    ApiResponse.success(res, 201, 'Guard created successfully', guard);
  } catch (error) {
    next(error);
  }
}

export async function updateGuard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const providerId = req.user!.providerId.toString();
    const { name, phone, employeeId, joiningDate, monthlySalary, designation, buildingId } = req.body;

    if (req.body.role || req.body.providerId || req.body.password || req.body.passwordHash) {
      throw ApiError.badRequest('Updating role, providerId, or password via this route is prohibited', 'RESTRICTED_FIELD');
    }

    if (name !== undefined && (!name || typeof name !== 'string' || !name.trim())) {
      throw ApiError.badRequest('Guard name cannot be empty', 'INVALID_NAME');
    }

    if (phone !== undefined && phone !== null && phone !== '') {
      if (typeof phone !== 'string' || !PHONE_REGEX.test(phone.trim())) {
        throw ApiError.badRequest('Invalid phone format', 'INVALID_PHONE');
      }
    }

    let parsedSalary: number | undefined;
    if (monthlySalary !== undefined && monthlySalary !== null && monthlySalary !== '') {
      parsedSalary = Number(monthlySalary);
      if (isNaN(parsedSalary) || parsedSalary < 0) {
        throw ApiError.badRequest('Monthly salary must be a valid non-negative number', 'INVALID_SALARY');
      }
    }

    const updatedGuard = await GuardService.updateGuard(id, providerId, {
      name: name ? name.trim() : undefined,
      phone: phone !== undefined ? (phone ? phone.trim() : '') : undefined,
      employeeId: employeeId !== undefined ? (employeeId ? String(employeeId).trim() : '') : undefined,
      joiningDate: joiningDate !== undefined ? (joiningDate || undefined) : undefined,
      monthlySalary: parsedSalary,
      designation: designation !== undefined ? (designation ? String(designation).trim() : '') : undefined,
      buildingId: buildingId ? String(buildingId) : undefined,
    });

    ApiResponse.success(res, 200, 'Guard updated successfully', updatedGuard);
  } catch (error) {
    next(error);
  }
}

export async function updateGuardStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const providerId = req.user!.providerId.toString();
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      throw ApiError.badRequest('isActive must be a boolean value', 'INVALID_STATUS');
    }

    const guard = await GuardService.updateGuardStatus(id, providerId, isActive);
    if (!isActive) {
      await RefreshToken.updateMany(
        { userId: id, revokedAt: null },
        { revokedAt: new Date() }
      );
    }
    ApiResponse.success(res, 200, `Guard status updated to ${isActive ? 'active' : 'inactive'}`, guard);
  } catch (error) {
    next(error);
  }
}

export async function getGuardMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const guardProfile = await GuardService.getGuardMe(userId);
    ApiResponse.success(res, 200, 'Guard profile retrieved successfully', guardProfile);
  } catch (error) {
    next(error);
  }
}
