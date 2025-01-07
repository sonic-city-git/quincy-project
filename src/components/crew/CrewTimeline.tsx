import { format, eachDayOfInterval, addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface CrewTimelineProps {
  startDate: Date;
  daysToShow: number;
  selectedCrew: Array<{
    id: string;
    name: string;
  }>;
  onPreviousPeriod: () => void;
  onNextPeriod: () => void;
}

export function CrewTimeline({ 
  startDate, 
  daysToShow, 
  selectedCrew,
  onPreviousPeriod,
  onNextPeriod
}: CrewTimelineProps) {
  const days = eachDayOfInterval({
    start: startDate,
    end: addDays(startDate, daysToShow - 1)
  });

  return (
    <div className="border-t border-zinc-800/50">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onPreviousPeriod}>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onPreviousPeriod}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            {format(startDate, 'dd MMM yyyy')} - {format(addDays(startDate, daysToShow - 1), 'dd MMM yyyy')}
          </span>
          <Button variant="ghost" size="sm" onClick={onNextPeriod}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onNextPeriod}>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            -
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            +
          </Button>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-14 gap-1 mb-4">
          {days.map((day) => (
            <div key={day.toISOString()} className="text-xs text-zinc-400">
              {format(day, 'dd')}
            </div>
          ))}
        </div>
        
        {selectedCrew.length > 0 ? (
          selectedCrew.map((crew) => (
            <div key={crew.id} className="mb-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium truncate">{crew.name}</span>
              </div>
              <div className="grid grid-cols-14 gap-1">
                {days.map((day) => (
                  <div 
                    key={day.toISOString()} 
                    className="h-3 bg-zinc-800/50 rounded-sm relative"
                  >
                    {Math.random() > 0.5 && (
                      <div 
                        className="absolute top-0 left-0 h-full bg-blue-500/50 rounded-sm"
                        style={{ width: '100%' }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-zinc-400">
            Select crew members to view their timeline
          </div>
        )}
      </div>
    </div>
  );
}