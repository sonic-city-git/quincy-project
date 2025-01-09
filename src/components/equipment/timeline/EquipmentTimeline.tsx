import { eachDayOfInterval, addDays, startOfWeek, format, isWeekend, getWeek } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface EquipmentTimelineProps {
  startDate: Date;
  daysToShow: number;
  selectedEquipment: Array<{
    id: string;
    name: string;
  }>;
  onPreviousPeriod: () => void;
  onNextPeriod: () => void;
  onMount?: (element: Element | null) => void;
  onUnmount?: (element: Element | null) => void;
}

export function EquipmentTimeline({
  startDate: providedStartDate,
  daysToShow,
  selectedEquipment,
  onPreviousPeriod,
  onNextPeriod,
  onMount,
  onUnmount,
}: EquipmentTimelineProps) {
  const startDate = startOfWeek(providedStartDate, { weekStartsOn: 1 });
  const endDate = addDays(startDate, daysToShow - 1);
  
  const days = eachDayOfInterval({
    start: startDate,
    end: endDate
  });

  const startWeek = getWeek(startDate);
  const endWeek = getWeek(endDate);

  return (
    <div className="h-[320px] border-t border-zinc-800/50">
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

      <ScrollArea className="h-[calc(100%-3rem)]">
        <div className="h-full flex flex-col">
          <div className="sticky top-0 z-10 bg-zinc-900 pb-4 flex-none">
            <div className="grid grid-cols-14 gap-1 mb-1">
              {days.map((day) => (
                <div 
                  key={`date-${day.toISOString()}`} 
                  className="text-xs text-zinc-400 text-center"
                >
                  {format(day, 'dd')}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-14 gap-1">
              {days.map((day) => (
                <div 
                  key={`weekday-${day.toISOString()}`} 
                  className={`text-xs ${isWeekend(day) ? 'text-red-400/70' : 'text-zinc-400'} text-center`}
                >
                  {format(day, 'EEEEE')}
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto px-4 bg-zinc-900 rounded-lg">
            {selectedEquipment.length > 0 ? (
              <div className="space-y-4 py-4">
                {selectedEquipment.map((equipment) => (
                  <div key={equipment.id}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium truncate">{equipment.name}</span>
                    </div>
                    <div className="grid grid-cols-14 gap-1">
                      {days.map((day) => (
                        <div 
                          key={day.toISOString()} 
                          className="h-3 bg-zinc-800/50 rounded-sm relative group"
                        >
                          {/* Assignment indicator would go here */}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-zinc-400">
                Select equipment to view their timeline
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}