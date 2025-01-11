import { Calendar } from "@/components/ui/calendar";
import { useCalendarDate } from "@/hooks/useCalendarDate";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useEventDialog } from "@/hooks/useEventDialog";
import { useEventTypes } from "@/hooks/useEventTypes";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
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

  // Create a modifier for each event
  const modifiers = events?.reduce((acc, event) => {
    const eventDate = new Date(event.date);
    const key = `event-${eventDate.getTime()}`;
    return {
      ...acc,
      [key]: (date: Date) => {
        const normalizedDate = normalizeDate(date);
        return event.date.getTime() === normalizedDate.getTime();
      }
    };
  }, {} as Record<string, (date: Date) => boolean>) || {};

  // Create styles for each event
  const modifiersStyles = events?.reduce((acc, event) => {
    const eventDate = new Date(event.date);
    const key = `event-${eventDate.getTime()}`;
    return {
      ...acc,
      [key]: {
        backgroundColor: event.type.color,
        color: '#FFFFFF',
        borderRadius: '8px',
        cursor: 'pointer',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }
    };
  }, {} as Record<string, React.CSSProperties>) || {};

  // Create content renderer for each event day
  const modifiersContent = events?.reduce((acc, event) => {
    const eventDate = new Date(event.date);
    const key = `event-${eventDate.getTime()}`;
    return {
      ...acc,
      [key]: ({ date }: { date: Date }) => (
        <HoverCard>
          <HoverCardTrigger asChild>
            <div className="w-full h-full flex items-center justify-center relative">
              {date.getDate()}
            </div>
          </HoverCardTrigger>
          <HoverCardContent 
            align="center"
            side="top"
            sideOffset={5}
            className="z-[100] bg-zinc-950 border border-zinc-800 text-white p-3 rounded-md shadow-xl w-[200px]"
          >
            <div className="space-y-1.5">
              <p className="font-semibold text-white">{event.name}</p>
              <p className="text-sm text-zinc-300">{event.type.name}</p>
            </div>
          </HoverCardContent>
        </HoverCard>
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