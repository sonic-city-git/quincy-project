import { addMonths, subMonths } from "date-fns";

export const normalizeDate = (date: Date | undefined | null): Date | null => {
  if (!date) return null;
  
  return new Date(Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  ));
};

export const getNextMonth = (currentDate: Date) => {
  return addMonths(currentDate, 1);
};

export const getPreviousMonth = (currentDate: Date) => {
  return subMonths(currentDate, 1);
};