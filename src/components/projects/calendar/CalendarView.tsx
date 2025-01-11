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
  console.log('CalendarView render', { selectedDates });

  return (
    <Calendar
      mode="multiple"
      month={currentDate}
      onMonthChange={setCurrentDate}
      events={events}
      selected={selectedDates}
      onSelect={(dates: Date[] | undefined) => {
        console.log('Calendar onSelect', { dates, selectedDates });
        if (!dates || dates.length === 0) return;

        const clickedDate = dates[dates.length - 1];
        console.log('Clicked date:', clickedDate);

        // Only trigger onDragStart, don't handle click here
        onDragStart(clickedDate);
      }}
      onDayMouseEnter={(date: Date) => {
        if (selectedDates.length > 0) {
          console.log('Day mouse enter', date);
          onDragEnter(date);
        }
      }}
      onDayClick={(date: Date) => {
        console.log('Calendar onDayClick', { date, selectedDatesLength: selectedDates.length });
        if (selectedDates.length === 0) {
          // Only handle click when not dragging
          onDayClick(date);
        }
      }}
      onDayMouseUp={(date: Date) => {
        console.log('Calendar onDayMouseUp', { date, selectedDatesLength: selectedDates.length });
        if (selectedDates.length > 0) {
          // If we were dragging, handle both the click and drag end
          onDayClick(date);
          onDragEnd();
        }
      }}
      className="w-full rounded-md border border-zinc-800 bg-zinc-950"
    />
  );
}