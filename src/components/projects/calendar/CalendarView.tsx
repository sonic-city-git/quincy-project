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
      mode="single"
      month={currentDate}
      onMonthChange={setCurrentDate}
      modifiers={modifiers}
      modifiersStyles={modifiersStyles}
      components={modifiersContent}
      className="w-full rounded-md border border-zinc-800 bg-zinc-950"
      selected={undefined}
      onSelect={onDragStart}
      onDayMouseEnter={onDragEnter}
      onDayClick={onDayClick}
      onDayMouseLeave={onDragEnd}
    />
  );
}