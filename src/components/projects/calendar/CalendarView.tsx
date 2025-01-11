import { useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CalendarEvent } from '@/types/events';

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
  const handleDateSelect = useCallback((selectInfo: any) => {
    onDragStart(selectInfo.start);
  }, [onDragStart]);

  const handleDateClick = useCallback((arg: any) => {
    onDayClick(arg.date);
  }, [onDayClick]);

  const formattedEvents = events.map(event => ({
    title: event.name,
    date: event.date,
    backgroundColor: event.type.color,
    borderColor: event.type.color,
    classNames: ['rounded-md', 'px-2', 'py-1'],
    extendedProps: {
      type: event.type
    }
  }));

  const selectedDateEvents = selectedDates.map(date => ({
    start: date,
    display: 'background',
    backgroundColor: '#3b82f680'
  }));

  return (
    <div className="w-full rounded-md border border-zinc-800 bg-zinc-950 p-4">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        selectable={true}
        select={handleDateSelect}
        dateClick={handleDateClick}
        events={[...formattedEvents, ...selectedDateEvents]}
        headerToolbar={{
          left: 'prev',
          center: 'title',
          right: 'next'
        }}
        height="auto"
        dayMaxEvents={true}
        firstDay={1}
        datesSet={(dateInfo) => setCurrentDate(dateInfo.start)}
        selectMirror={true}
        unselectAuto={false}
        // Styling
        dayCellClassNames="hover:bg-zinc-900 transition-colors border-zinc-800"
        dayHeaderClassNames="text-zinc-400 uppercase text-xs font-medium py-2"
        slotLaneClassNames="border-zinc-800"
        slotLabelClassNames="text-zinc-400"
        titleFormat={{ month: 'long', year: 'numeric' }}
        buttonClassNames="bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded transition-colors"
        buttonText={{
          today: 'Today',
          month: 'Month',
          week: 'Week',
          day: 'Day',
          list: 'List'
        }}
      />
    </div>
  );
}