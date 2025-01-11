import { Calendar } from "@/components/ui/calendar";
import { useCalendarDate } from "@/hooks/useCalendarDate";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useEventDialog } from "@/hooks/useEventDialog";
import { useEventTypes } from "@/hooks/useEventTypes";
import { CalendarDay } from "./CalendarDay";
import { useCalendarModifiers } from "./CalendarModifiers";
import { AddEventDialog } from "./AddEventDialog";
import { EditEventDialog } from "./EditEventDialog";

interface ProjectCalendarProps {
  projectId: string;
}

export function ProjectCalendar({ projectId }: ProjectCalendarProps) {
  const { currentDate, setCurrentDate, normalizeDate } = useCalendarDate();
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

  const { modifiers, modifiersStyles } = useCalendarModifiers(events);

  const handleDayClick = (date: Date) => {
    const normalizedDate = normalizeDate(date);
    const existingEvent = events?.find(event => 
      event.date.getTime() === normalizedDate.getTime()
    );

    if (existingEvent) {
      openEditDialog(existingEvent);
    } else {
      openAddDialog(normalizedDate);
    }
  };

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
    return <div>Loading calendar...</div>;
  }

  return (
    <div className="w-full">
      <Calendar
        mode="single"
        month={currentDate}
        onMonthChange={setCurrentDate}
        onDayClick={handleDayClick}
        modifiers={modifiers}
        modifiersStyles={modifiersStyles}
        components={modifiersContent}
        className="w-full rounded-md border border-zinc-800 bg-zinc-950"
        selected={undefined}
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