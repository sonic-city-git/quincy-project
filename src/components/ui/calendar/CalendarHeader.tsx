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
      <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
        <Button
          variant="ghost"
          className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
          onClick={handlePreviousMonth}
        >
          <ChevronLeft className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
        </Button>
        
        <button
          onClick={handleResetMonth}
          className="text-sm sm:text-lg md:text-xl font-medium min-w-[120px] sm:min-w-[140px] md:min-w-[160px] text-center hover:text-primary transition-colors"
        >
          {format(month, 'MMMM yyyy')}
        </button>

        <Button
          variant="ghost"
          className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
          onClick={handleNextMonth}
        >
          <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
        </Button>
      </div>
    </div>
  );
}