import { Calendar } from "@/components/ui/calendar";
import { useCalendarDate } from "@/hooks/useCalendarDate";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useEventDialog } from "@/hooks/useEventDialog";
import { useEventTypes } from "@/hooks/useEventTypes";
import { CalendarDay } from "./CalendarDay";
import { useCalendarModifiers } from "./CalendarModifiers";
import { EventDialog } from "./EventDialog";
import { useQuery } from "@tanstack/react-query";
import { fetchEvents } from "@/utils/eventQueries";
import { useState, useCallback } from "react";

interface ProjectCalendarProps {
  projectId: string;
}

export function ProjectCalendar({ projectId }: ProjectCalendarProps) {
  const { currentDate, setCurrentDate, normalizeDate } = useCalendarDate();
  const { data: eventTypes } = useEventTypes();
  const { addEvent, updateEvent } = useCalendarEvents(projectId);
  const {
    selectedDate,
    isAddDialogOpen,
    isEditDialogOpen,
    selectedEvent,
    openAddDialog,
    closeAddDialog,
    closeEditDialog,
    openEditDialog,
    addEventCallback
  } = useEventDialog();

  // Drag selection state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartDate, setDragStartDate] = useState<Date | null>(null);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events', projectId],
    queryFn: () => fetchEvents(projectId),
    refetchOnWindowFocus: true,
  });

  const { modifiers, modifiersStyles } = useCalendarModifiers(events, selectedDates);

  const handleDayClick = useCallback((date: Date) => {
    if (isDragging) {
      handleDragEnd();
      return;
    }

    const normalizedDate = normalizeDate(date);
    const existingEvent = events?.find(event => 
      event.date.getTime() === normalizedDate.getTime()
    );

    if (existingEvent) {
      openEditDialog(existingEvent);
    } else {
      openAddDialog(normalizedDate);
    }
  }, [isDragging, events, normalizeDate, openEditDialog, openAddDialog]);

  const handleDragStart = useCallback((date: Date) => {
    setIsDragging(true);
    const normalizedDate = normalizeDate(date);
    setDragStartDate(normalizedDate);
    setSelectedDates([normalizedDate]);
  }, [normalizeDate]);

  const handleDragEnter = useCallback((date: Date) => {
    if (!isDragging || !dragStartDate) return;

    const normalizedDate = normalizeDate(date);
    const startTime = dragStartDate.getTime();
    const currentTime = normalizedDate.getTime();

    // Calculate all dates between start and current
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
  }, [isDragging, dragStartDate, normalizeDate]);

  const handleDragEnd = useCallback(async () => {
    if (!isDragging || selectedDates.length === 0) return;

    setIsDragging(false);
    setDragStartDate(null);
    const firstDate = selectedDates[0];
    
    // Open dialog for the first date - when user completes it, we'll create events for all dates
    openAddDialog(firstDate, async (date: Date, name: string, eventType: any) => {
      // Create events for all selected dates
      for (const selectedDate of selectedDates) {
        await addEvent(selectedDate, name, eventType);
      }
      setSelectedDates([]);
    });
  }, [isDragging, selectedDates, openAddDialog, addEvent]);

  // Create content renderer for each event day
  const modifiersContent = events?.reduce((acc, event) => {
    const eventDate = new Date(event.date);
    const key = `event-${eventDate.getTime()}`;
    return {
      ...acc,
      [key]: ({ date }: { date: Date }) => (
        <CalendarDay date={date} event={event} />
      )
    };
  }, {} as Record<string, (props: { date: Date }) => JSX.Element>) || {};

  if (isLoading || !eventTypes) {
    return null;
  }

  return (
    <div className="w-full space-y-8">
      <Calendar
        mode="single"
        month={currentDate}
        onMonthChange={setCurrentDate}
        modifiers={modifiers}
        modifiersStyles={modifiersStyles}
        components={modifiersContent}
        className="w-full rounded-md border border-zinc-800 bg-zinc-950"
        selected={undefined}
        onSelect={(date: Date | undefined) => {
          if (!date) return;
          handleDragStart(date);
        }}
        onDayMouseEnter={(date: Date) => handleDragEnter(date)}
        onDayClick={handleDayClick}
      />

      <EventDialog
        isOpen={isAddDialogOpen}
        onClose={closeAddDialog}
        date={selectedDate}
        eventTypes={eventTypes}
        onAddEvent={addEvent}
        addEventCallback={addEventCallback}
      />

      <EventDialog
        isOpen={isEditDialogOpen}
        onClose={closeEditDialog}
        event={selectedEvent}
        eventTypes={eventTypes}
        onUpdateEvent={updateEvent}
      />
    </div>
  );
}