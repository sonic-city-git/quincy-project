import { Calendar } from "@/components/ui/calendar/Calendar";
import { CalendarEvent } from "@/types/events";

interface CalendarViewProps {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  events: CalendarEvent[];
  selectedDates: Date[];
  onDragStart: (date: Date) => void;
  onDragEnter: (date: Date) => void;
  onDayClick: (date: Date) => void;
  onDragEnd: () => void;
}

export function CalendarView({
  currentDate,
  setCurrentDate,
  events,
  selectedDates,
  onDragStart,
  onDragEnter,
  onDayClick,
  onDragEnd
}: CalendarViewProps) {
  return (
    <Calendar
      mode="multiple"
      month={currentDate}
      onMonthChange={setCurrentDate}
      events={events}
      selected={selectedDates}
      onSelect={(dates: Date[] | undefined) => {
        if (dates && dates.length > 0) {
          const lastDate = dates[dates.length - 1];
          onDragStart(lastDate);
        }
      }}
      onDayMouseEnter={(date: Date) => {
        if (selectedDates.length > 0) {
          onDragEnter(date);
        }
      }}
      onDayClick={(date: Date) => {
        // If we're not in the middle of a drag operation, handle the click
        if (selectedDates.length === 0) {
          onDayClick(date);
        } else {
          // If we are in a drag operation, end it
          onDragEnd();
        }
      }}
      className="w-full rounded-md border border-zinc-800 bg-zinc-950"
    />
  );
}