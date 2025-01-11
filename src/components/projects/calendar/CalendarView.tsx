import { Calendar } from "@/components/ui/calendar/Calendar";
import { CalendarEvent } from "@/types/events";
import { normalizeDate } from "@/utils/calendarUtils";

interface CalendarViewProps {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  events: CalendarEvent[];
  onDayClick: (date: Date) => void;
}

export function CalendarView({
  currentDate,
  setCurrentDate,
  events,
  onDayClick
}: CalendarViewProps) {
  console.log('CalendarView render');

  const handleDayClick = (date: Date) => {
    const normalizedDate = normalizeDate(date);
    if (!normalizedDate) return;
    console.log('Triggering click for date:', normalizedDate);
    onDayClick(normalizedDate);
  };

  return (
    <Calendar
      mode="single"
      month={currentDate}
      onMonthChange={setCurrentDate}
      events={events}
      onDayClick={handleDayClick}
      className="w-full rounded-md border border-zinc-800 bg-zinc-950"
    />
  );
}