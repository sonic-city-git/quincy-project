import { addMonths, subMonths } from "date-fns";

export const getNextMonth = (currentDate: Date) => {
  return addMonths(currentDate, 1);
};

export const getPreviousMonth = (currentDate: Date) => {
  return subMonths(currentDate, 1);
};