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
    console.log('handleDayMouseUp', { date, selectedDatesLength: selectedDates.length });
    if (selectedDates.length > 0) {
      const startDate = normalizeDate(selectedDates[0]);
      const endDate = normalizeDate(date);
      console.log('Processing selection', { startDate, endDate });
      
      // Call onDayClick with the normalized start date before ending the drag
      onDayClick(startDate);
      
      // End the drag operation after handling the click
      setTimeout(() => {
        onDragEnd();
      }, 0);
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
        console.log('Calendar onSelect', { dates, selectedDates });
        if (!dates || dates.length === 0) return;
        const clickedDate = normalizeDate(dates[dates.length - 1]);
        console.log('Starting drag with date:', clickedDate);
        onDragStart(clickedDate);
      }}
      onDayMouseEnter={(date: Date) => {
        console.log('Day mouse enter', date);
        onDragEnter(normalizeDate(date));
      }}
      onDayClick={(date: Date) => {
        console.log('Calendar onDayClick', { date, selectedDatesLength: selectedDates.length });
        if (selectedDates.length === 0) {
          onDayClick(normalizeDate(date));
        }
      }}
      onDayMouseUp={handleDayMouseUp}
      className="w-full rounded-md border border-zinc-800 bg-zinc-950"
    />
  );
}