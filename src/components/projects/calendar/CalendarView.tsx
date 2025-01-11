import { Calendar } from "@/components/ui/calendar";
import { CalendarEvent } from "@/types/events";
import { CalendarDay } from "./CalendarDay";
import { useCalendarModifiers } from "./CalendarModifiers";

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
  const { modifiers, modifiersStyles } = useCalendarModifiers(events, selectedDates);

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

  return (
    <Calendar
      mode="multiple"
      month={currentDate}
      onMonthChange={setCurrentDate}
      modifiers={modifiers}
      modifiersStyles={modifiersStyles}
      components={modifiersContent}
      className="w-full rounded-md border border-zinc-800 bg-zinc-950"
      selected={selectedDates}
      onSelect={(dates: Date[] | undefined) => {
        if (dates && dates.length > 0) {
          onDragStart(dates[dates.length - 1]);
        }
      }}
      onDayMouseEnter={(date: Date) => {
        onDragEnter(date);
      }}
      onDayClick={(date: Date) => {
        onDayClick(date);
        onDragEnd();
      }}
    />
  );
}