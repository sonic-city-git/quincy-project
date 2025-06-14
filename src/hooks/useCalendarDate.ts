import { useState } from "react";
import { getNextMonth, getPreviousMonth } from "@/utils/calendarUtils";

export const useCalendarDate = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const nextMonth = () => {
    setCurrentDate(getNextMonth(currentDate));
  };

  const previousMonth = () => {
    setCurrentDate(getPreviousMonth(currentDate));
  };

  return {
    currentDate,
    setCurrentDate,
    nextMonth,
    previousMonth
  };
};