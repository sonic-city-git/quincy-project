import { useState } from "react";
import { addMonths, subMonths } from "date-fns";

export const useCalendarDate = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const normalizeDate = (date: Date): Date => {
    return new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    ));
  };

  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const previousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  return {
    currentDate,
    normalizeDate,
    nextMonth,
    previousMonth
  };
};