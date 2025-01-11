import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface CalendarHeaderProps {
  month: Date;
  onMonthChange: (date: Date) => void;
}

export function CalendarHeader({ month, onMonthChange }: CalendarHeaderProps) {
  const handlePreviousMonth = () => {
    const previousMonth = new Date(month);
    previousMonth.setMonth(month.getMonth() - 1);
    onMonthChange(previousMonth);
  };

  const handleNextMonth = () => {
    const nextMonth = new Date(month);
    nextMonth.setMonth(month.getMonth() + 1);
    onMonthChange(nextMonth);
  };

  const handleResetMonth = () => {
    onMonthChange(new Date());
  };

  return (
    <div className="relative flex items-center justify-center pt-1">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
          onClick={handlePreviousMonth}
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
          className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
          onClick={handleNextMonth}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}