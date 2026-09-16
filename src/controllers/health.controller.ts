import { Request, Response, NextFunction } from 'express';
import { HealthService } from '../services/health.service';
import { ApiResponse } from '../utils/apiResponse';

export class HealthController {
  public static checkHealth(_req: Request, res: Response, next: NextFunction): void {
    try {
      const healthData = HealthService.getHealthData();
      ApiResponse.success(res, 200, 'Security Management Backend API operational', healthData);
    } catch (error) {
      next(error);
    }
  }
}
