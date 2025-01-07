import { useState, useCallback } from 'react';
import { addDays, subDays } from 'date-fns';

export function useEquipmentTimeline(daysToShow: number = 14) {
  const [startDate, setStartDate] = useState(new Date());

  const handlePreviousPeriod = useCallback(() => {
    setStartDate(prev => subDays(prev, daysToShow));
  }, [daysToShow]);

  const handleNextPeriod = useCallback(() => {
    setStartDate(prev => addDays(prev, daysToShow));
  }, [daysToShow]);

  return {
    startDate,
    handlePreviousPeriod,
    handleNextPeriod,
  };
}