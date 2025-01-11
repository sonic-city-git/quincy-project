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

  const {
    selectedDate,
    isAddDialogOpen,
    isEditDialogOpen,
    selectedEvent,
    openAddDialog,
    closeAddDialog,
    closeEditDialog,
    openEditDialog,
  } = useEventDialog();

  const handleDayClick = useCallback((date: Date) => {
    const normalizedDate = normalizeDate(date);
    const existingEvent = findEventOnDate(normalizedDate);

    if (existingEvent) {
      openEditDialog(existingEvent);
    } else if (!isDragging) {
      openAddDialog(normalizedDate);
    }
  }, [normalizeDate, findEventOnDate, isDragging, openEditDialog, openAddDialog]);

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
        onClose={closeAddDialog}
        date={selectedDate}
        eventTypes={eventTypes}
        onAddEvent={addEvent}
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