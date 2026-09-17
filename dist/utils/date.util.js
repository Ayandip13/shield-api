"use strict";
/**
 * Date handling utility for attendance & shift management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDateToYYYYMMDD = formatDateToYYYYMMDD;
exports.isValidTimeString = isValidTimeString;
/**
 * Format a Date object or date string into YYYY-MM-DD format (local calendar date).
 */
function formatDateToYYYYMMDD(date = new Date()) {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) {
        throw new Error('Invalid date provided to formatDateToYYYYMMDD');
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
/**
 * Validate time format HH:mm (e.g. 08:00, 20:30)
 */
function isValidTimeString(timeStr) {
    if (!timeStr || typeof timeStr !== 'string')
        return false;
    const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return regex.test(timeStr.trim());
}
