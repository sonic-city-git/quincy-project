import React from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarHeaderProps {
  month: Date;
  onMonthChange: (date: Date) => void;
}

export function CalendarHeader({ month, onMonthChange }: CalendarHeaderProps) {
  const handleResetMonth = () => {
    onMonthChange(new Date());
  };

  return (
    <div className="flex items-center justify-center relative pt-1">
      <div className="flex items-center min-w-[280px] justify-between">
        <Button
          variant="ghost"
          className="h-10 w-10 bg-transparent p-0 opacity-50 hover:opacity-100 rounded-full"
          onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <button
          onClick={handleResetMonth}
          className="text-xl font-medium min-w-[160px] text-center hover:text-primary transition-colors"
        >
          {format(month, 'MMMM yyyy')}
        </button>

        <Button
          variant="ghost"
          className="h-10 w-10 bg-transparent p-0 opacity-50 hover:opacity-100 rounded-full"
          onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}