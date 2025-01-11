import { useCalendarDate } from "@/hooks/useCalendarDate";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useEventDialog } from "@/hooks/useEventDialog";
import { useEventTypes } from "@/hooks/useEventTypes";
import { EventDialog } from "./EventDialog";
import { useQuery } from "@tanstack/react-query";
import { fetchEvents } from "@/utils/eventQueries";
import { useCallback } from "react";
import { useCalendarDrag } from "@/hooks/useCalendarDrag";
import { CalendarView } from "./CalendarView";

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

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events', projectId],
    queryFn: () => fetchEvents(projectId),
    refetchOnWindowFocus: true,
  });

  const {
    isDragging,
    selectedDates,
    handleDragStart,
    handleDragEnter,
    handleDragEnd,
    resetSelection
  } = useCalendarDrag(openAddDialog, addEvent);

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
  }, [isDragging, events, normalizeDate, openEditDialog, openAddDialog, handleDragEnd]);

  const handleCloseAddDialog = useCallback(() => {
    closeAddDialog();
    resetSelection();
  }, [closeAddDialog, resetSelection]);

  if (isLoading || !eventTypes) {
    return null;
  }

  return (
    <div className="w-full space-y-8">
      <CalendarView
        currentDate={currentDate}
        setCurrentDate={setCurrentDate}
        events={events}
        selectedDates={selectedDates}
        onDragStart={handleDragStart}
        onDragEnter={handleDragEnter}
        onDayClick={handleDayClick}
        onDragEnd={handleDragEnd}
      />

      <EventDialog
        isOpen={isAddDialogOpen}
        onClose={handleCloseAddDialog}
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