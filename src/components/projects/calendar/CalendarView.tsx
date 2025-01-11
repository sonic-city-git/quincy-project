import { Calendar } from "@/components/ui/calendar/Calendar";
import { CalendarEvent } from "@/types/events";
import { normalizeDate } from "@/utils/calendarUtils";

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
  console.log('CalendarView render', { selectedDates });

  const handleDayMouseUp = (date: Date) => {
    const normalizedDate = normalizeDate(date);
    if (!normalizedDate) return;

    // If we were dragging (have selected dates), end the drag
    if (selectedDates.length > 0) {
      console.log('Ending drag');
      onDragEnd();
    } else {
      // If we weren't dragging, this was a click
      console.log('Triggering click for date:', normalizedDate);
      onDayClick(normalizedDate);
    }
  };

  return (
    <Calendar
      mode="multiple"
      month={currentDate}
      onMonthChange={setCurrentDate}
      events={events}
      selected={selectedDates}
      onSelect={(dates: Date[] | undefined) => {
        if (!dates || dates.length === 0) return;
        
        const clickedDate = normalizeDate(dates[dates.length - 1]);
        if (!clickedDate) return;
        
        console.log('Starting drag with date:', clickedDate);
        onDragStart(clickedDate);
      }}
      onDayMouseEnter={(date: Date) => {
        const normalizedDate = normalizeDate(date);
        if (!normalizedDate) return;
        onDragEnter(normalizedDate);
      }}
      onDayClick={(date: Date) => {
        console.log('Day clicked:', date);
        // Remove this handler as we're handling clicks in mouseUp
      }}
      onDayMouseUp={handleDayMouseUp}
      className="w-full rounded-md border border-zinc-800 bg-zinc-950"
    />
  );
}