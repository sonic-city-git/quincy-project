import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, getWeek } from "date-fns";

interface TimelineHeaderProps {
  startDate: Date;
  endDate: Date;
  onPreviousPeriod: () => void;
  onNextPeriod: () => void;
}

export function TimelineHeader({ 
  startDate, 
  endDate, 
  onPreviousPeriod, 
  onNextPeriod 
}: TimelineHeaderProps) {
  const startWeek = getWeek(startDate);
  const endWeek = getWeek(endDate);

  return (
    <div className="sticky top-0 bg-zinc-900 z-10 p-4 flex flex-col items-center gap-2 border-b border-zinc-800/50">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onPreviousPeriod}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm">
          {format(startDate, 'dd MMM yyyy')} - {format(endDate, 'dd MMM yyyy')}
        </span>
        <Button variant="ghost" size="sm" onClick={onNextPeriod}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="text-sm text-zinc-400">
        Week {startWeek}{startWeek !== endWeek ? ` - ${endWeek}` : ''}
      </div>
    </div>
  );
}