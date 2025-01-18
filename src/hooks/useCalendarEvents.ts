import { useState, useCallback } from 'react';
import { CalendarEvent, EventType } from '@/types/events';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchEvents, createEvent, updateEvent as updateEventQuery, deleteEvent as deleteEventQuery } from '@/utils/eventQueries';
import { toast } from 'sonner';
import { useEventManagement } from './useEventManagement';
import { compareDates } from '@/utils/dateFormatters';

export const useCalendarEvents = (projectId: string | undefined) => {
  const queryClient = useQueryClient();
  const { addEvent: addEventHandler } = useEventManagement(projectId);

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

  const addEvent = async (date: Date, eventName: string, eventType: EventType, status: CalendarEvent['status'] = 'proposed') => {
    const newEvent = await addEventHandler(date, eventName, eventType, status);
    
    queryClient.setQueryData(['events', projectId], (old: CalendarEvent[] | undefined) => 
      old ? [...old, newEvent] : [newEvent]
    );
    
    return newEvent;
  };

  const updateEvent = async (updatedEvent: CalendarEvent) => {
    if (!projectId) return;
    
    try {
      await updateEventQuery(projectId, updatedEvent);
      
      queryClient.setQueryData(['events', projectId], (old: CalendarEvent[] | undefined) => 
        old?.map(event => 
          event.id === updatedEvent.id
            ? updatedEvent
            : event
        ) || []
      );

      toast.success("Event updated successfully");
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error("Failed to update event");
      throw error;
    }
  };

  const deleteEvent = async (event: CalendarEvent) => {
    if (!projectId) return;

    try {
      await deleteEventQuery(event.id, projectId);

      // Invalidate queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['events', projectId] }),
        queryClient.invalidateQueries({ queryKey: ['calendar-events', projectId] }),
        queryClient.invalidateQueries({ queryKey: ['project-event-equipment', event.id] }),
        queryClient.invalidateQueries({ queryKey: ['project-event-roles', event.id] })
      ]);

      toast.success("Event deleted successfully");
      return true;
    } catch (error) {
      console.error('Error in deleteEvent:', error);
      toast.error("Failed to delete event");
      throw error;
    }
  };

  const findEventOnDate = useCallback((date: Date) => {
    return events.find(event => compareDates(event.date, date));
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
    updateEvent,
    deleteEvent
  };
};