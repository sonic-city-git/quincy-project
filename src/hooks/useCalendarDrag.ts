import { useState, useCallback } from 'react';
import { normalizeDate } from '@/utils/calendarUtils';

export const useCalendarDrag = (openAddDialog: (date: Date, callback?: (date: Date, name: string, eventType: any) => void) => void, addEvent: any) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartDate, setDragStartDate] = useState<Date | null>(null);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);

  const handleDragStart = useCallback((date: Date | undefined) => {
    if (!date) return;
    
    setIsDragging(true);
    const normalizedDate = normalizeDate(date);
    if (!normalizedDate) return;
    
    setDragStartDate(normalizedDate);
    setSelectedDates([normalizedDate]);
  }, []);

  const handleDragEnter = useCallback((date: Date) => {
    if (!isDragging || !dragStartDate) return;

    const normalizedDate = normalizeDate(date);
    if (!normalizedDate) return;
    
    const startTime = dragStartDate.getTime();
    const currentTime = normalizedDate.getTime();

    const dates: Date[] = [];
    const direction = currentTime >= startTime ? 1 : -1;
    let currentDate = new Date(startTime);

    while (
      direction > 0 ? currentDate.getTime() <= currentTime : currentDate.getTime() >= currentTime
    ) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + direction);
    }

    setSelectedDates(dates);
  }, [isDragging, dragStartDate]);

  const handleDragEnd = useCallback(() => {
    if (!isDragging || selectedDates.length === 0) return;

    setIsDragging(false);
    setDragStartDate(null);
    
    openAddDialog(selectedDates[0], async (date: Date, name: string, eventType: any) => {
      for (const selectedDate of selectedDates) {
        await addEvent(selectedDate, name, eventType);
      }
      setSelectedDates([]);
    });
  }, [isDragging, selectedDates, openAddDialog, addEvent]);

  const resetSelection = useCallback(() => {
    setSelectedDates([]);
    setIsDragging(false);
    setDragStartDate(null);
  }, []);

  return {
    isDragging,
    selectedDates,
    handleDragStart,
    handleDragEnter,
    handleDragEnd,
    resetSelection
  };
};