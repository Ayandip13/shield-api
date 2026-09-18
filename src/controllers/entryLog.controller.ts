import { Request, Response, NextFunction } from 'express';
import { EntryLogService, CreateEntryLogDto, EntryLogFilters } from '../services/entryLog.service';
import { ApiResponse } from '../utils/apiResponse';
import { PersonType } from '../models/entryLog.model';

export async function createEntryLog(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const guardUserId = req.user!.id;
    const dto: CreateEntryLogDto = {
      personName: req.body.personName,
      phone: req.body.phone,
      personType: req.body.personType,
      purpose: req.body.purpose,
      flatUnit: req.body.flatUnit,
      notes: req.body.notes,
    };

    const entryLog = await EntryLogService.createEntry(guardUserId, dto);
    ApiResponse.success(res, 201, 'Entry log recorded successfully', entryLog);
  } catch (error) {
    next(error);
  }
}

export async function markEntryExit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const guardUserId = req.user!.id;
    const entryLogId = req.params.id as string;

    const updatedLog = await EntryLogService.markExit(guardUserId, entryLogId);
    ApiResponse.success(res, 200, 'Exit recorded successfully', updatedLog);
  } catch (error) {
    next(error);
  }
}

export async function getActiveEntries(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const buildingIdFilter = req.query.buildingId ? (req.query.buildingId as string) : undefined;
    const records = await EntryLogService.getActiveEntries(req.user!, buildingIdFilter);
    ApiResponse.success(res, 200, 'Active entries retrieved successfully', records);
  } catch (error) {
    next(error);
  }
}

export async function getEntryLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const filters: EntryLogFilters = {
      buildingId: req.query.buildingId ? (req.query.buildingId as string) : undefined,
      guardId: req.query.guardId ? (req.query.guardId as string) : undefined,
      personType: req.query.personType ? (req.query.personType as PersonType) : undefined,
      date: req.query.date ? (req.query.date as string) : undefined,
      from: req.query.from ? (req.query.from as string) : undefined,
      to: req.query.to ? (req.query.to as string) : undefined,
      active: req.query.active !== undefined ? (req.query.active as string) : undefined,
    };

    const records = await EntryLogService.getEntryLogs(req.user!, filters);
    ApiResponse.success(res, 200, 'Entry logs retrieved successfully', records);
  } catch (error) {
    next(error);
  }
}

export async function getEntryLogById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const entryLogId = req.params.id as string;
    const record = await EntryLogService.getEntryLogById(req.user!, entryLogId);
    ApiResponse.success(res, 200, 'Entry log retrieved successfully', record);
  } catch (error) {
    next(error);
  }
}
