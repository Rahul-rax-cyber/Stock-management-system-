/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DailyLog, MasterItem, ExpenseLog } from '../types';
import { DEFAULT_ITEMS } from '../constants';
import { generateExcelHTML } from './excel';

const MASTER_ITEMS_KEY = 'stock_cash_ledger_items';
const DAILY_LOGS_KEY_PREFIX = 'stock_cash_ledger_log_';
const LOG_INDEX_KEY = 'stock_cash_ledger_log_index';

// Fetch all master items
export function getMasterItems(): MasterItem[] {
  try {
    const data = localStorage.getItem(MASTER_ITEMS_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading master items from localStorage:', e);
  }
  
  // Initialize default items if not present
  saveMasterItems(DEFAULT_ITEMS);
  return DEFAULT_ITEMS;
}

// Save master items
export function saveMasterItems(items: MasterItem[]): void {
  try {
    localStorage.setItem(MASTER_ITEMS_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Error saving master items to localStorage:', e);
  }
}

// Get index of all dates that have logs
export function getLogDates(): string[] {
  try {
    const data = localStorage.getItem(LOG_INDEX_KEY);
    if (data) {
      const dates: string[] = JSON.parse(data);
      return dates.sort((a, b) => b.localeCompare(a)); // Sort descending (newest first)
    }
  } catch (e) {
    console.error('Error reading log index:', e);
  }
  return [];
}

// Add a date to the index
function addDateToIndex(date: string): void {
  const dates = getLogDates();
  if (!dates.includes(date)) {
    dates.push(date);
    try {
      localStorage.setItem(LOG_INDEX_KEY, JSON.stringify(dates));
    } catch (e) {
      console.error('Error updating log index:', e);
    }
  }
}

// Find the most recent daily log before a specific date
export function getPreviousDayLog(date: string): DailyLog | null {
  const dates = getLogDates();
  // Filter for dates before the given date and sort descending (newest first)
  const previousDates = dates
    .filter((d) => d < date)
    .sort((a, b) => b.localeCompare(a));
  
  if (previousDates.length > 0) {
    return getDailyLog(previousDates[0]);
  }
  return null;
}

// Fetch daily log for a specific date (or initialize a new one)
export function getDailyLog(date: string): DailyLog {
  const key = `${DAILY_LOGS_KEY_PREFIX}${date}`;
  try {
    const data = localStorage.getItem(key);
    if (data) {
      const log: DailyLog = JSON.parse(data);
      return log;
    }
  } catch (e) {
    console.error(`Error reading daily log for ${date}:`, e);
  }

  // If no log exists, initialize one.
  // We can attempt to pull opening stock from the previous day's balance!
  const masterItems = getMasterItems();
  const previousLog = getPreviousDayLog(date);

  const stockItems = masterItems.map((item) => {
    // Check if there is a previous day's balance to carry over
    const prevItem = previousLog?.stockItems.find((prev) => prev.itemId === item.id);
    const openStock = prevItem ? prevItem.balanceStock : item.defaultOpenStock;

    return {
      itemId: item.id,
      itemName: item.name,
      openStock,
      refillStock: 0,
      balanceStock: openStock, // Default balance same as open stock
      salesCount: 0,
      itemPrice: item.defaultPrice,
    };
  });

  const newLog: DailyLog = {
    id: date,
    date,
    stockItems,
    cashDetails: {
      morningOpening: previousLog ? previousLog.cashDetails.nightClosing : 0, // Carry over night closing cash as morning opening!
      nightClosing: 0,
      gpaySales: 0,
      handSales: 0,
    },
    expenses: [],
    notes: '',
    isCompleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  saveDailyLog(newLog);
  return newLog;
}

// Save daily log
export function saveDailyLog(log: DailyLog): void {
  const key = `${DAILY_LOGS_KEY_PREFIX}${log.date}`;
  try {
    log.updatedAt = new Date().toISOString();
    localStorage.setItem(key, JSON.stringify(log));
    
    // Also save in excel format in localStorage with centrally aligned digits
    const excelHtml = generateExcelHTML(log);
    localStorage.setItem(`excel_ledger_export_${log.date}`, excelHtml);
    
    addDateToIndex(log.date);
  } catch (e) {
    console.error(`Error saving daily log for ${log.date}:`, e);
  }
}

// Delete a daily log
export function deleteDailyLog(date: string): void {
  const key = `${DAILY_LOGS_KEY_PREFIX}${date}`;
  try {
    localStorage.removeItem(key);
    localStorage.removeItem(`excel_ledger_export_${date}`);
    const dates = getLogDates();
    const updatedDates = dates.filter((d) => d !== date);
    localStorage.setItem(LOG_INDEX_KEY, JSON.stringify(updatedDates));
  } catch (e) {
    console.error(`Error deleting daily log for ${date}:`, e);
  }
}

// Fetch all saved daily logs
export function getAllDailyLogs(): DailyLog[] {
  const dates = getLogDates();
  return dates
    .map((date) => getDailyLog(date))
    .sort((a, b) => b.date.localeCompare(a.date)); // Newest first
}

// Import all logs from a JSON backup
export function importLogsBackup(jsonData: string): { success: boolean; message: string } {
  try {
    const data = JSON.parse(jsonData);
    if (!data || typeof data !== 'object') {
      return { success: false, message: 'Invalid file format.' };
    }

    if (data.masterItems && Array.isArray(data.masterItems)) {
      saveMasterItems(data.masterItems);
    }

    if (data.dailyLogs && typeof data.dailyLogs === 'object') {
      const dates: string[] = [];
      Object.entries(data.dailyLogs).forEach(([date, logData]) => {
        const key = `${DAILY_LOGS_KEY_PREFIX}${date}`;
        localStorage.setItem(key, JSON.stringify(logData));
        dates.push(date);
      });
      localStorage.setItem(LOG_INDEX_KEY, JSON.stringify(dates));
      return { success: true, message: `Successfully imported items and ${dates.length} daily logs.` };
    }

    return { success: false, message: 'No valid daily logs or items found in the file.' };
  } catch (e) {
    return { success: false, message: 'Failed to parse JSON backup file.' };
  }
}

// Export all logs as a JSON backup
export function exportLogsBackup(): string {
  const items = getMasterItems();
  const dates = getLogDates();
  const dailyLogs: { [date: string]: DailyLog } = {};
  
  dates.forEach((date) => {
    dailyLogs[date] = getDailyLog(date);
  });

  const backupData = {
    exportDate: new Date().toISOString(),
    masterItems: items,
    dailyLogs,
  };

  return JSON.stringify(backupData, null, 2);
}
