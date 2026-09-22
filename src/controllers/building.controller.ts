import { Request, Response, NextFunction } from 'express';
import { BuildingService } from '../services/building.service';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';

// Validation helpers
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+0-9\s\-()]{5,20}$/;

function validateBuildingInput(body: any, isUpdate = false): {
  name?: string;
  address?: string;
  contactPhone?: string;
  contactEmail?: string;
} {
  const { name, address, contactPhone, contactEmail } = body;

  if (!isUpdate || name !== undefined) {
    if (!name || typeof name !== 'string' || !name.trim()) {
      throw ApiError.badRequest('Building name is required', 'MISSING_NAME');
    }
    if (name.trim().length < 2 || name.trim().length > 100) {
      throw ApiError.badRequest('Building name must be between 2 and 100 characters', 'INVALID_NAME_LENGTH');
    }
  }

  if (!isUpdate || address !== undefined) {
    if (!address || typeof address !== 'string' || !address.trim()) {
      throw ApiError.badRequest('Building address is required', 'MISSING_ADDRESS');
    }
    if (address.trim().length < 3 || address.trim().length > 300) {
      throw ApiError.badRequest('Building address must be between 3 and 300 characters', 'INVALID_ADDRESS_LENGTH');
    }
  }

  if (contactEmail !== undefined && contactEmail !== null && contactEmail !== '') {
    if (typeof contactEmail !== 'string' || !EMAIL_REGEX.test(contactEmail.trim().toLowerCase())) {
      throw ApiError.badRequest('Invalid contact email format', 'INVALID_EMAIL');
    }
  }

  if (contactPhone !== undefined && contactPhone !== null && contactPhone !== '') {
    if (typeof contactPhone !== 'string' || !PHONE_REGEX.test(contactPhone.trim())) {
      throw ApiError.badRequest('Invalid contact phone number format', 'INVALID_PHONE');
    }
  }

  return {
    name: name ? name.trim() : undefined,
    address: address ? address.trim() : undefined,
    contactPhone: contactPhone !== undefined ? (contactPhone ? contactPhone.trim() : '') : undefined,
    contactEmail: contactEmail !== undefined ? (contactEmail ? contactEmail.trim().toLowerCase() : '') : undefined,
  };
}

export async function getBuildings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const providerId = req.user!.providerId.toString();
    const buildings = await BuildingService.getBuildingsByProvider(providerId);
    ApiResponse.success(res, 200, 'Buildings retrieved successfully', buildings);
  } catch (error) {
    next(error);
  }
}

export async function getBuildingById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const providerId = req.user!.providerId.toString();
    const building = await BuildingService.getBuildingById(id, providerId);
    ApiResponse.success(res, 200, 'Building retrieved successfully', building);
  } catch (error) {
    next(error);
  }
}

export async function createBuilding(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const providerId = req.user!.providerId.toString();
    const validatedData = validateBuildingInput(req.body, false);

    const building = await BuildingService.createBuilding(providerId, {
      name: validatedData.name!,
      address: validatedData.address!,
      contactPhone: validatedData.contactPhone,
      contactEmail: validatedData.contactEmail,
    });

    ApiResponse.success(res, 201, 'Building created successfully', building);
  } catch (error) {
    next(error);
  }
}

export async function updateBuilding(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const providerId = req.user!.providerId.toString();

    // Prevent attempt to change providerId or restricted fields
    if (req.body.providerId) {
      throw ApiError.badRequest('Changing building providerId is not permitted', 'IMMUTABLE_FIELD');
    }

    const validatedData = validateBuildingInput(req.body, true);

    const building = await BuildingService.updateBuilding(id, providerId, validatedData);
    ApiResponse.success(res, 200, 'Building updated successfully', building);
  } catch (error) {
    next(error);
  }
}

export async function updateBuildingStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const providerId = req.user!.providerId.toString();
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      throw ApiError.badRequest('isActive field must be a boolean', 'INVALID_STATUS');
    }

    const building = await BuildingService.updateBuildingStatus(id, providerId, isActive);
    ApiResponse.success(
      res,
      200,
      `Building ${isActive ? 'activated' : 'deactivated'} successfully`,
      building
    );
  } catch (error) {
    next(error);
  }
}

export async function deleteBuilding(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const providerId = req.user!.providerId.toString();

    await BuildingService.deleteBuilding(id, providerId);
    ApiResponse.success(res, 200, 'Building deleted successfully', null);
  } catch (error) {
    next(error);
  }
}
