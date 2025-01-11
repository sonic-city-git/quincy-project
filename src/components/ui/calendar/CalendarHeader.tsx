import React from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarHeaderProps {
  month: Date;
  onMonthChange: (date: Date) => void;
}

export function CalendarHeader({ month, onMonthChange }: CalendarHeaderProps) {
  return (
    <div className="flex items-center justify-between pt-1">
      <Button
        variant="ghost"
        className="h-10 w-10 bg-transparent p-0 opacity-50 hover:opacity-100 rounded-full"
        onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <div className="text-xl font-medium">
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
  );
}