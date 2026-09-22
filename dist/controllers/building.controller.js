"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBuildings = getBuildings;
exports.getBuildingById = getBuildingById;
exports.createBuilding = createBuilding;
exports.updateBuilding = updateBuilding;
exports.updateBuildingStatus = updateBuildingStatus;
exports.deleteBuilding = deleteBuilding;
const building_service_1 = require("../services/building.service");
const apiResponse_1 = require("../utils/apiResponse");
const apiError_1 = require("../utils/apiError");
// Validation helpers
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+0-9\s\-()]{5,20}$/;
function validateBuildingInput(body, isUpdate = false) {
    const { name, address, contactPhone, contactEmail } = body;
    if (!isUpdate || name !== undefined) {
        if (!name || typeof name !== 'string' || !name.trim()) {
            throw apiError_1.ApiError.badRequest('Building name is required', 'MISSING_NAME');
        }
        if (name.trim().length < 2 || name.trim().length > 100) {
            throw apiError_1.ApiError.badRequest('Building name must be between 2 and 100 characters', 'INVALID_NAME_LENGTH');
        }
    }
    if (!isUpdate || address !== undefined) {
        if (!address || typeof address !== 'string' || !address.trim()) {
            throw apiError_1.ApiError.badRequest('Building address is required', 'MISSING_ADDRESS');
        }
        if (address.trim().length < 3 || address.trim().length > 300) {
            throw apiError_1.ApiError.badRequest('Building address must be between 3 and 300 characters', 'INVALID_ADDRESS_LENGTH');
        }
    }
    if (contactEmail !== undefined && contactEmail !== null && contactEmail !== '') {
        if (typeof contactEmail !== 'string' || !EMAIL_REGEX.test(contactEmail.trim().toLowerCase())) {
            throw apiError_1.ApiError.badRequest('Invalid contact email format', 'INVALID_EMAIL');
        }
    }
    if (contactPhone !== undefined && contactPhone !== null && contactPhone !== '') {
        if (typeof contactPhone !== 'string' || !PHONE_REGEX.test(contactPhone.trim())) {
            throw apiError_1.ApiError.badRequest('Invalid contact phone number format', 'INVALID_PHONE');
        }
    }
    return {
        name: name ? name.trim() : undefined,
        address: address ? address.trim() : undefined,
        contactPhone: contactPhone !== undefined ? (contactPhone ? contactPhone.trim() : '') : undefined,
        contactEmail: contactEmail !== undefined ? (contactEmail ? contactEmail.trim().toLowerCase() : '') : undefined,
    };
}
async function getBuildings(req, res, next) {
    try {
        const providerId = req.user.providerId.toString();
        const buildings = await building_service_1.BuildingService.getBuildingsByProvider(providerId);
        apiResponse_1.ApiResponse.success(res, 200, 'Buildings retrieved successfully', buildings);
    }
    catch (error) {
        next(error);
    }
}
async function getBuildingById(req, res, next) {
    try {
        const id = req.params.id;
        const providerId = req.user.providerId.toString();
        const building = await building_service_1.BuildingService.getBuildingById(id, providerId);
        apiResponse_1.ApiResponse.success(res, 200, 'Building retrieved successfully', building);
    }
    catch (error) {
        next(error);
    }
}
async function createBuilding(req, res, next) {
    try {
        const providerId = req.user.providerId.toString();
        const validatedData = validateBuildingInput(req.body, false);
        const building = await building_service_1.BuildingService.createBuilding(providerId, {
            name: validatedData.name,
            address: validatedData.address,
            contactPhone: validatedData.contactPhone,
            contactEmail: validatedData.contactEmail,
        });
        apiResponse_1.ApiResponse.success(res, 201, 'Building created successfully', building);
    }
    catch (error) {
        next(error);
    }
}
async function updateBuilding(req, res, next) {
    try {
        const id = req.params.id;
        const providerId = req.user.providerId.toString();
        // Prevent attempt to change providerId or restricted fields
        if (req.body.providerId) {
            throw apiError_1.ApiError.badRequest('Changing building providerId is not permitted', 'IMMUTABLE_FIELD');
        }
        const validatedData = validateBuildingInput(req.body, true);
        const building = await building_service_1.BuildingService.updateBuilding(id, providerId, validatedData);
        apiResponse_1.ApiResponse.success(res, 200, 'Building updated successfully', building);
    }
    catch (error) {
        next(error);
    }
}
async function updateBuildingStatus(req, res, next) {
    try {
        const id = req.params.id;
        const providerId = req.user.providerId.toString();
        const { isActive } = req.body;
        if (typeof isActive !== 'boolean') {
            throw apiError_1.ApiError.badRequest('isActive field must be a boolean', 'INVALID_STATUS');
        }
        const building = await building_service_1.BuildingService.updateBuildingStatus(id, providerId, isActive);
        apiResponse_1.ApiResponse.success(res, 200, `Building ${isActive ? 'activated' : 'deactivated'} successfully`, building);
    }
    catch (error) {
        next(error);
    }
}
async function deleteBuilding(req, res, next) {
    try {
        const id = req.params.id;
        const providerId = req.user.providerId.toString();
        await building_service_1.BuildingService.deleteBuilding(id, providerId);
        apiResponse_1.ApiResponse.success(res, 200, 'Building deleted successfully', null);
    }
    catch (error) {
        next(error);
    }
}
