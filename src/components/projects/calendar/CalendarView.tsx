import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { nb } from 'date-fns/locale';
import { CalendarEvent } from "@/types/events";
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'nb': nb,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

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
  const formattedEvents = events.map(event => ({
    title: event.name,
    start: event.date,
    end: event.date,
    allDay: true,
    resource: event
  }));

  const selectedDateEvents = selectedDates.map(date => ({
    title: 'Selected',
    start: date,
    end: date,
    allDay: true,
    className: 'selected-date'
  }));

  return (
    <div className="h-[600px] rounded-md border border-zinc-800 bg-zinc-950">
      <Calendar
        localizer={localizer}
        events={[...formattedEvents, ...selectedDateEvents]}
        startAccessor="start"
        endAccessor="end"
        defaultView={Views.MONTH}
        date={currentDate}
        onNavigate={setCurrentDate}
        selectable
        onSelecting={(range) => {
          if (range.start) onDragStart(range.start);
          if (range.end) onDragEnter(range.end);
        }}
        onSelectSlot={({ start }) => {
          if (start) onDayClick(new Date(start));
          onDragEnd();
        }}
        className="h-full"
        formats={{
          monthHeaderFormat: 'MMMM yyyy',
          dayHeaderFormat: 'EEE',
          dayRangeHeaderFormat: ({ start }) => format(start, 'MMMM yyyy')
        }}
        messages={{
          today: 'I dag',
          previous: 'Forrige',
          next: 'Neste',
          month: 'Måned',
          week: 'Uke',
          day: 'Dag'
        }}
        components={{
          toolbar: (props) => (
            <div className="rbc-toolbar">
              <span className="rbc-btn-group">
                <button type="button" onClick={() => props.onNavigate('PREV')}>
                  Forrige
                </button>
                <button type="button" onClick={() => props.onNavigate('TODAY')}>
                  I dag
                </button>
                <button type="button" onClick={() => props.onNavigate('NEXT')}>
                  Neste
                </button>
              </span>
              <span className="rbc-toolbar-label">{format(currentDate, 'MMMM yyyy', { locale: nb })}</span>
            </div>
          )
        }}
      />

      <style jsx global>{`
        .rbc-calendar {
          color: rgb(255 255 255 / 0.9);
          background-color: rgb(24 24 27);
        }
        .rbc-month-view {
          border-color: rgb(39 39 42);
        }
        .rbc-header {
          border-color: rgb(39 39 42);
          padding: 8px;
          font-weight: 500;
          color: rgb(161 161 170);
        }
        .rbc-off-range-bg {
          background-color: rgb(24 24 27);
        }
        .rbc-off-range {
          color: rgb(82 82 91);
        }
        .rbc-today {
          background-color: rgb(39 39 42);
        }
        .rbc-event {
          background-color: rgb(113 113 122);
          border-color: rgb(82 82 91);
          color: white;
        }
        .selected-date {
          background-color: rgb(161 161 170) !important;
          opacity: 0.5;
        }
        .rbc-toolbar button {
          color: rgb(255 255 255 / 0.9);
          border-color: rgb(39 39 42);
        }
        .rbc-toolbar button:hover {
          background-color: rgb(39 39 42);
        }
        .rbc-toolbar button:active,
        .rbc-toolbar button.rbc-active {
          background-color: rgb(63 63 70);
          border-color: rgb(82 82 91);
        }
        .rbc-month-row,
        .rbc-day-bg {
          border-color: rgb(39 39 42);
        }
      `}</style>
    </div>
  );
}