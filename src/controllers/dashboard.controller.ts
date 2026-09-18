import { Request, Response, NextFunction } from 'express';
import {
  getProviderDashboardData,
  getCommitteeDashboardData,
  getGuardDashboardData,
  getSecurityActivityStream,
} from '../services/dashboard.service';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';

/**
 * Controller: GET /api/v1/dashboard
 * Role-aware dashboard handler for provider_admin and committee members
 */
export async function getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      throw ApiError.unauthorized('Authentication token required.', 'UNAUTHORIZED');
    }

    if (user.role === 'provider_admin') {
      const buildingIdFilter = typeof req.query.buildingId === 'string' ? req.query.buildingId : undefined;
      const data = await getProviderDashboardData(user.providerId, buildingIdFilter);
      ApiResponse.success(res, 200, 'Provider dashboard retrieved successfully', data);
      return;
    }

    if (user.role === 'committee') {
      const data = await getCommitteeDashboardData(user);
      ApiResponse.success(res, 200, 'Committee dashboard retrieved successfully', data);
      return;
    }

    if (user.role === 'guard') {
      throw ApiError.forbidden(
        'Guards do not have access to system dashboards. Use /api/v1/dashboard/guard instead.',
        'FORBIDDEN'
      );
    }

    throw ApiError.badRequest('Invalid user role.', 'INVALID_ROLE');
  } catch (error: any) {
    next(error);
  }
}

/**
 * Controller: GET /api/v1/dashboard/guard
 * Duty status summary for guard operational terminal
 */
export async function getGuardDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      throw ApiError.unauthorized('Authentication token required.', 'UNAUTHORIZED');
    }

    const data = await getGuardDashboardData(user);
    ApiResponse.success(res, 200, 'Guard duty dashboard retrieved successfully', data);
  } catch (error: any) {
    next(error);
  }
}

/**
 * Controller: GET /api/v1/dashboard/activity
 * Paginated/recent activity stream for provider and committee screens
 */
export async function getActivityStream(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      throw ApiError.unauthorized('Authentication token required.', 'UNAUTHORIZED');
    }

    const buildingIdFilter = typeof req.query.buildingId === 'string' ? req.query.buildingId : undefined;
    const limit = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : 20;

    const data = await getSecurityActivityStream(user, buildingIdFilter, isNaN(limit) ? 20 : limit);
    ApiResponse.success(res, 200, 'Security activity stream retrieved successfully', data);
  } catch (error: any) {
    next(error);
  }
}
