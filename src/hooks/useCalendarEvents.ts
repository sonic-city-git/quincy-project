import { useState, useCallback } from 'react';
import { CalendarEvent, EventType } from '@/types/events';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchEvents } from '@/utils/eventQueries';
import { useToast } from '@/hooks/use-toast';
import { useEventManagement } from './useEventManagement';
import { compareDates } from '@/utils/dateFormatters';

export const useCalendarEvents = (projectId: string | undefined) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { addEvent: addEventHandler, updateEvent: updateEventHandler } = useEventManagement(projectId);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [dragStartDate, setDragStartDate] = useState<Date | null>(null);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events', projectId],
    queryFn: () => fetchEvents(projectId || ''),
    enabled: !!projectId
  });

  const handleDragStart = useCallback((date: Date | undefined) => {
    if (!date) return;
    setIsDragging(true);
    setDragStartDate(date);
    setSelectedDates([date]);
  }, []);

  const handleDragEnter = useCallback((date: Date) => {
    if (!isDragging || !dragStartDate) return;
    
    const startTime = dragStartDate.getTime();
    const currentTime = date.getTime();

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

  const addEvent = async (date: Date, eventName: string, eventType: EventType) => {
    const newEvent = await addEventHandler(date, eventName, eventType);
    
    queryClient.setQueryData(['events', projectId], (old: CalendarEvent[] | undefined) => 
      old ? [...old, newEvent] : [newEvent]
    );
    
    return newEvent;
  };

  const updateEvent = async (updatedEvent: CalendarEvent) => {
    const updated = await updateEventHandler(updatedEvent);
    
    queryClient.setQueryData(['events', projectId], (old: CalendarEvent[] | undefined) => 
      old?.map(event => 
        event.date.getTime() === updated.date.getTime()
          ? updated
          : event
      ) || []
    );
  };

  const findEventOnDate = useCallback((date: Date) => {
    return events.find(event => {
      const eventDate = new Date(event.date);
      return compareDates(eventDate, date);
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
    findEventOnDate,
    addEvent,
    updateEvent
  };
};