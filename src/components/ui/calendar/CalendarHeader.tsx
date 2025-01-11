import React from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarHeaderProps {
  month: Date;
  onMonthChange: (date: Date) => void;
}

export function CalendarHeader({ month, onMonthChange }: CalendarHeaderProps) {
  const handleResetMonth = () => {
    onMonthChange(new Date());
  };

  return (
    <div className="flex items-center justify-between pt-1">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          className="h-10 w-10 bg-transparent p-0 opacity-50 hover:opacity-100 rounded-full"
          onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="text-xl font-medium px-2">
          {format(month, 'MMMM yyyy')}
        </div>

        <Button
          variant="ghost"
          className="h-10 w-10 bg-transparent p-0 opacity-50 hover:opacity-100 rounded-full"
          onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <Button
        variant="ghost"
        className="h-10 w-10 bg-transparent p-0 opacity-50 hover:opacity-100 rounded-full"
        onClick={handleResetMonth}
        title="Reset to current month"
      >
        <Calendar className="h-4 w-4" />
      </Button>
    </div>
  );
}