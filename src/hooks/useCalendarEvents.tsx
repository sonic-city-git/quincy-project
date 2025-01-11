import { useState, useCallback } from 'react';
import { CalendarEvent, EventType } from '@/types/events';
import { normalizeDate } from '@/utils/calendarUtils';
import { useQuery } from '@tanstack/react-query';
import { fetchEvents } from '@/utils/eventQueries';

export const useCalendarEvents = (projectId: string) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [dragStartDate, setDragStartDate] = useState<Date | null>(null);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events', projectId],
    queryFn: () => fetchEvents(projectId),
    refetchOnWindowFocus: true,
  });

  const handleDragStart = useCallback((date: Date | undefined) => {
    if (!date) return;
    
    const normalizedDate = normalizeDate(date);
    if (!normalizedDate) return;
    
    setIsDragging(true);
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

  const resetSelection = useCallback(() => {
    setSelectedDates([]);
    setIsDragging(false);
    setDragStartDate(null);
  }, []);

  const findEventOnDate = useCallback((date: Date) => {
    const normalizedTargetDate = normalizeDate(date);
    return events.find(event => {
      const eventDate = new Date(event.date);
      return normalizeDate(eventDate).getTime() === normalizedTargetDate.getTime();
    });
  }, [events]);

  return {
    events,
    isLoading,
    isDragging,
    selectedDates,
    handleDragStart,
    handleDragEnter,
    resetSelection,
    findEventOnDate
  };
};