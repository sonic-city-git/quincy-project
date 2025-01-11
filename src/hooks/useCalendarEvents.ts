import { useState, useCallback } from 'react';
import { CalendarEvent, EventType } from '@/types/events';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchEvents } from '@/utils/eventQueries';
import { useToast } from '@/hooks/use-toast';
import { useEventManagement } from './useEventManagement';
import { compareDates } from '@/utils/dateFormatters';
import { supabase } from '@/integrations/supabase/client';

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

  const deleteEvent = async (event: CalendarEvent) => {
    if (!projectId) return;

    try {
      const { error } = await supabase
        .from('project_events')
        .delete()
        .eq('id', event.id)
        .eq('project_id', projectId);

      if (error) throw error;

      queryClient.setQueryData(['events', projectId], (old: CalendarEvent[] | undefined) => 
        old?.filter(e => e.id !== event.id) || []
      );

      toast({
        title: "Event Deleted",
        description: "The event has been successfully removed",
      });

    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      });
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