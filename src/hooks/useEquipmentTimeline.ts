import { useState } from "react";
import { addDays, subDays } from "date-fns";

export function useEquipmentTimeline() {
  const [startDate, setStartDate] = useState(new Date());
  const daysToShow = 14;

  const handlePreviousPeriod = () => {
    setStartDate(prev => subDays(prev, daysToShow));
  };

  const handleNextPeriod = () => {
    setStartDate(prev => addDays(prev, daysToShow));
  };

  return {
    startDate,
    handlePreviousPeriod,
    handleNextPeriod,
  };
}