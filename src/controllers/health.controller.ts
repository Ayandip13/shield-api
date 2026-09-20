import { Request, Response, NextFunction } from 'express';
import { HealthService } from '../services/health.service';
import { ApiResponse } from '../utils/apiResponse';

export class HealthController {
  public static checkHealth(_req: Request, res: Response, next: NextFunction): void {
    try {
      const healthData = HealthService.getHealthData();
      const isConnected = healthData.database.connected;
      const statusCode = isConnected ? 200 : 503;
      const message = isConnected
        ? 'Security Management Backend API operational'
        : 'Security Management Backend API degraded - Database disconnected';

      ApiResponse.success(res, statusCode, message, healthData);
    } catch (error) {
      next(error);
    }
  }
}
