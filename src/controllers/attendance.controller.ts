import { Request, Response, NextFunction } from 'express';
import { AttendanceService } from '../services/attendance.service';
import { ApiResponse } from '../utils/apiResponse';

export async function checkInGuard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const guardUserId = req.user!.id;
    const attendance = await AttendanceService.checkIn(guardUserId);
    ApiResponse.success(res, 201, 'Duty check-in successful', attendance);
  } catch (error) {
    next(error);
  }
}

export async function checkOutGuard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const guardUserId = req.user!.id;
    const { notes } = req.body;
    const attendance = await AttendanceService.checkOut(guardUserId, notes);
    ApiResponse.success(res, 200, 'Duty check-out successful', attendance);
  } catch (error) {
    next(error);
  }
}

export async function getGuardAttendanceHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const guardUserId = req.user!.id;
    const from = req.query.from ? (req.query.from as string) : undefined;
    const to = req.query.to ? (req.query.to as string) : undefined;

    const history = await AttendanceService.getGuardHistory(guardUserId, from, to);
    ApiResponse.success(res, 200, 'Attendance history retrieved successfully', history);
  } catch (error) {
    next(error);
  }
}

export async function getGuardTodayStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const guardUserId = req.user!.id;
    const status = await AttendanceService.getGuardTodayStatus(guardUserId);
    ApiResponse.success(res, 200, 'Today duty attendance status retrieved', status);
  } catch (error) {
    next(error);
  }
}

export async function getProviderAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const providerId = req.user!.providerId.toString();
    const buildingId = req.query.buildingId ? (req.query.buildingId as string) : undefined;
    const guardId = req.query.guardId ? (req.query.guardId as string) : undefined;
    const date = req.query.date ? (req.query.date as string) : undefined;
    const from = req.query.from ? (req.query.from as string) : undefined;
    const to = req.query.to ? (req.query.to as string) : undefined;

    const records = await AttendanceService.getProviderAttendance(providerId, {
      buildingId,
      guardId,
      date,
      from,
      to,
    });
    ApiResponse.success(res, 200, 'Provider attendance records retrieved successfully', records);
  } catch (error) {
    next(error);
  }
}

export async function getCommitteeAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const committeeUserId = req.user!.id;
    const date = req.query.date ? (req.query.date as string) : undefined;
    const from = req.query.from ? (req.query.from as string) : undefined;
    const to = req.query.to ? (req.query.to as string) : undefined;

    const records = await AttendanceService.getCommitteeAttendance(committeeUserId, {
      date,
      from,
      to,
    });
    ApiResponse.success(res, 200, 'Building attendance records retrieved successfully', records);
  } catch (error) {
    next(error);
  }
}
