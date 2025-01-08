import { format } from "date-fns";

export const formatDisplayDate = (date: Date) => {
  return format(date, 'dd.MM.yy');
};

export const formatDatabaseDate = (date: Date) => {
  return date.toISOString().split('T')[0];
};

export const compareDates = (date1: Date, date2: Date) => {
  return formatDatabaseDate(date1) === formatDatabaseDate(date2);
};