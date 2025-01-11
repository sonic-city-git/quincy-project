import { addMonths, subMonths } from "date-fns";

export const normalizeDate = (date: Date | undefined | null): Date | null => {
  if (!date) return null;
  
  // Create a new date object and set it to midnight in the local timezone
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  
  return normalized;
};

export const getNextMonth = (currentDate: Date) => {
  return addMonths(currentDate, 1);
};

export const getPreviousMonth = (currentDate: Date) => {
  return subMonths(currentDate, 1);
};