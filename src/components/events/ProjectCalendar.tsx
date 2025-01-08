import { Calendar } from "@/components/ui/calendar";
import { AddEventDialog } from "./AddEventDialog";
import { EditEventDialog } from "./EditEventDialog";
import { DayProps } from "react-day-picker";
import { useParams } from "react-router-dom";
import { CalendarDay } from "./CalendarDay";
import { EVENT_COLORS } from "@/constants/eventColors";
import { useEventDialog } from "@/hooks/useEventDialog";
import { useCalendarDate } from "@/hooks/useCalendarDate";
import { EventsProvider } from "@/contexts/EventsContext";

export const ProjectCalendar = () => {
  const { projectId } = useParams();
  const { normalizeDate } = useCalendarDate();
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

  if (!projectId) return null;

  return (
    <EventsProvider projectId={projectId}>
      <div className="w-full min-h-[400px]">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (!date) return;
            const normalizedDate = normalizeDate(date);
            openAddDialog(normalizedDate);
          }}
          className="w-full rounded-md border shadow-sm"
          modifiers={{ today: undefined }}
          modifiersClassNames={{
            selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          }}
          modifiersStyles={{
            today: {
              fontWeight: 'normal',
              border: 'none'
            }
          }}
          components={{
            Day: ({ date, ...props }: DayProps) => (
              <CalendarDay
                date={date}
                eventColors={EVENT_COLORS}
                onSelect={(date) => {
                  const normalizedDate = normalizeDate(date);
                  openAddDialog(normalizedDate);
                }}
                {...props}
              />
            ),
          }}
        />
        <AddEventDialog
          isOpen={isAddDialogOpen}
          onOpenChange={closeAddDialog}
          date={selectedDate}
        />
        <EditEventDialog
          isOpen={isEditDialogOpen}
          onOpenChange={closeEditDialog}
          event={selectedEvent}
        />
      </div>
    </EventsProvider>
  );
};