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

  const handleDragEnd = useCallback(() => {
    if (!isDragging || selectedDates.length === 0) return;

    setIsDragging(false);
    setDragStartDate(null);
    const firstDate = selectedDates[0];
    
    openAddDialog(firstDate, async (date: Date, name: string, eventType: any) => {
      for (const selectedDate of selectedDates) {
        await addEvent(selectedDate, name, eventType);
      }
      setSelectedDates([]);
    });
  }, [isDragging, selectedDates, openAddDialog, addEvent]);

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
        onSelect={handleDragStart}
        onDayMouseEnter={handleDragEnter}
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