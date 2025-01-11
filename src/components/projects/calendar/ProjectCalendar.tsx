import { Calendar } from "@/components/ui/calendar";
import { useCalendarDate } from "@/hooks/useCalendarDate";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useEventDialog } from "@/hooks/useEventDialog";
import { useEventTypes } from "@/hooks/useEventTypes";
import { EVENT_COLORS } from "@/constants/eventColors";
import { format } from "date-fns";
import { CalendarEvent } from "@/types/events";
import { AddEventDialog } from "./AddEventDialog";
import { EditEventDialog } from "./EditEventDialog";

interface ProjectCalendarProps {
  projectId: string;
}

export function ProjectCalendar({ projectId }: ProjectCalendarProps) {
  const { currentDate, nextMonth, previousMonth, normalizeDate } = useCalendarDate();
  const { events, isLoading, addEvent, updateEvent } = useCalendarEvents(projectId);
  const { data: eventTypes } = useEventTypes();
  const {
    selectedDate,
    isAddDialogOpen,
    isEditDialogOpen,
    selectedEvent,
    openAddDialog,
    openEditDialog,
    closeAddDialog,
    closeEditDialog,
  } = useEventDialog();

  const handleDayClick = (date: Date) => {
    const normalizedDate = normalizeDate(date);
    const existingEvent = events.find(event => 
      event.date.getTime() === normalizedDate.getTime()
    );

    if (existingEvent) {
      openEditDialog(existingEvent);
    } else {
      openAddDialog(normalizedDate);
    }
  };

  const modifiers = {
    event: (date: Date) => {
      return events.some(event => 
        event.date.getTime() === normalizeDate(date).getTime()
      );
    }
  };

  const modifiersStyles = {
    event: {
      fontWeight: 'bold',
      textDecoration: 'underline'
    }
  };

  if (isLoading || !eventTypes) {
    return <div>Loading calendar...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
      </div>

      <Calendar
        mode="single"
        selected={currentDate}
        month={currentDate}
        onDayClick={handleDayClick}
        modifiers={modifiers}
        modifiersStyles={modifiersStyles}
        className="rounded-md border"
      />

      <AddEventDialog
        isOpen={isAddDialogOpen}
        onClose={closeAddDialog}
        date={selectedDate}
        eventTypes={eventTypes}
        onAddEvent={addEvent}
      />

      <EditEventDialog
        isOpen={isEditDialogOpen}
        onClose={closeEditDialog}
        event={selectedEvent}
        eventTypes={eventTypes}
        onUpdateEvent={updateEvent}
      />
    </div>
  );
}