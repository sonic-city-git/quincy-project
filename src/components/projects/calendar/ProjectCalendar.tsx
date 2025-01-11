import { useCalendarDate } from "@/hooks/useCalendarDate";
import { useEventDialog } from "@/hooks/useEventDialog";
import { useEventTypes } from "@/hooks/useEventTypes";
import { EventDialog } from "./EventDialog";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useCallback } from "react";
import { CalendarView } from "./CalendarView";

interface ProjectCalendarProps {
  projectId: string;
}

export function ProjectCalendar({ projectId }: ProjectCalendarProps) {
  const { currentDate, setCurrentDate, normalizeDate } = useCalendarDate();
  const { data: eventTypes } = useEventTypes();
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

  const {
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
  } = useCalendarEvents(projectId);

  const handleDayClick = useCallback((date: Date) => {
    const normalizedDate = normalizeDate(date);
    console.log('Handling day click:', { date: normalizedDate });
    
    const existingEvent = findEventOnDate(normalizedDate);
    console.log('Existing event found:', existingEvent);

    if (existingEvent) {
      console.log('Opening edit dialog for event:', existingEvent);
      openEditDialog(existingEvent);
    } else if (!isDragging) {
      console.log('Opening add dialog for date:', normalizedDate);
      openAddDialog(normalizedDate, addEvent);
    }
  }, [normalizeDate, findEventOnDate, isDragging, openEditDialog, openAddDialog, addEvent]);

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
        onDragEnd={resetSelection}
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