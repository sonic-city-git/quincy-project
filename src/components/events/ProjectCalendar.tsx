import { useState } from "react";
import { Card } from "@/components/ui/card";
import { CalendarDay } from "./CalendarDay";
import { useCalendarDate } from "@/hooks/useCalendarDate";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface ProjectCalendarProps {
  projectId: string;
}

export const ProjectCalendar = ({ projectId }: ProjectCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { currentDate, nextMonth, previousMonth } = useCalendarDate();
  const { events, isLoading } = useCalendarEvents(projectId);

  // Generate array of dates for the current month
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }

    return days;
  };

  const days = getDaysInMonth();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={previousMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <Button variant="ghost" size="sm" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-px bg-muted">
        {days.map((date, index) => (
          <CalendarDay
            key={index}
            date={date}
            onSelect={setSelectedDate}
            className=""
          />
        ))}
      </div>
    </div>
  );
};