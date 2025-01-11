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
    
    // Find if there's an event on this date
    const eventOnDate = events.find(event => {
      const eventDate = new Date(event.date);
      return normalizeDate(eventDate).getTime() === normalizedDate.getTime();
    });

    console.log('Triggering click for date:', normalizedDate, 'Event:', eventOnDate);
    
    // Pass both the date and event to the click handler
    if (eventOnDate) {
      console.log('Found event, opening edit dialog:', eventOnDate);
      onDayClick(eventOnDate.date);
    } else {
      console.log('No event found, opening add dialog');
      onDayClick(normalizedDate);
    }
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