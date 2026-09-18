"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEntryLog = createEntryLog;
exports.markEntryExit = markEntryExit;
exports.getActiveEntries = getActiveEntries;
exports.getEntryLogs = getEntryLogs;
exports.getEntryLogById = getEntryLogById;
const entryLog_service_1 = require("../services/entryLog.service");
const apiResponse_1 = require("../utils/apiResponse");
async function createEntryLog(req, res, next) {
    try {
        const guardUserId = req.user.id;
        const dto = {
            personName: req.body.personName,
            phone: req.body.phone,
            personType: req.body.personType,
            purpose: req.body.purpose,
            flatUnit: req.body.flatUnit,
            notes: req.body.notes,
        };
        const entryLog = await entryLog_service_1.EntryLogService.createEntry(guardUserId, dto);
        apiResponse_1.ApiResponse.success(res, 201, 'Entry log recorded successfully', entryLog);
    }
    catch (error) {
        next(error);
    }
}
async function markEntryExit(req, res, next) {
    try {
        const guardUserId = req.user.id;
        const entryLogId = req.params.id;
        const updatedLog = await entryLog_service_1.EntryLogService.markExit(guardUserId, entryLogId);
        apiResponse_1.ApiResponse.success(res, 200, 'Exit recorded successfully', updatedLog);
    }
    catch (error) {
        next(error);
    }
}
async function getActiveEntries(req, res, next) {
    try {
        const buildingIdFilter = req.query.buildingId ? req.query.buildingId : undefined;
        const records = await entryLog_service_1.EntryLogService.getActiveEntries(req.user, buildingIdFilter);
        apiResponse_1.ApiResponse.success(res, 200, 'Active entries retrieved successfully', records);
    }
    catch (error) {
        next(error);
    }
}
async function getEntryLogs(req, res, next) {
    try {
        const filters = {
            buildingId: req.query.buildingId ? req.query.buildingId : undefined,
            guardId: req.query.guardId ? req.query.guardId : undefined,
            personType: req.query.personType ? req.query.personType : undefined,
            date: req.query.date ? req.query.date : undefined,
            from: req.query.from ? req.query.from : undefined,
            to: req.query.to ? req.query.to : undefined,
            active: req.query.active !== undefined ? req.query.active : undefined,
        };
        const records = await entryLog_service_1.EntryLogService.getEntryLogs(req.user, filters);
        apiResponse_1.ApiResponse.success(res, 200, 'Entry logs retrieved successfully', records);
    }
    catch (error) {
        next(error);
    }
}
async function getEntryLogById(req, res, next) {
    try {
        const entryLogId = req.params.id;
        const record = await entryLog_service_1.EntryLogService.getEntryLogById(req.user, entryLogId);
        apiResponse_1.ApiResponse.success(res, 200, 'Entry log retrieved successfully', record);
    }
    catch (error) {
        next(error);
    }
}
