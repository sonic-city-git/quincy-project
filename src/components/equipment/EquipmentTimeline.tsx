import { format, eachDayOfInterval, addDays, getWeek, isWeekend, startOfWeek } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef } from "react";

const EQUIPMENT_ASSIGNMENTS = {
  "904": [ // Equipment ID
    { startDate: "2024-03-20", endDate: "2024-03-25", projectName: "Project A" },
    { startDate: "2024-04-01", endDate: "2024-04-05", projectName: "Project B" }
  ],
  "2404": [
    { startDate: "2024-03-22", endDate: "2024-03-24", projectName: "Project C" }
  ],
  "1024": [
    { startDate: "2024-03-28", endDate: "2024-04-02", projectName: "Project D" }
  ]
};

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
  onUnmount
}: EquipmentTimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = timelineRef.current;
    onMount?.(element);
    
    return () => {
      onUnmount?.(element);
    };
  }, [onMount, onUnmount]);

  const startDate = startOfWeek(providedStartDate, { weekStartsOn: 1 });
  
  const days = eachDayOfInterval({
    start: startDate,
    end: addDays(startDate, daysToShow - 1)
  });

  const endDate = addDays(startDate, daysToShow - 1);
  const startWeek = getWeek(startDate);
  const endWeek = getWeek(endDate);

  const isDateInRange = (date: Date, startDateStr: string, endDateStr: string) => {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    return date >= start && date <= end;
  };

  const getAssignmentsForDay = (equipmentId: string, date: Date) => {
    const assignments = EQUIPMENT_ASSIGNMENTS[equipmentId] || [];
    return assignments.filter(assignment => 
      isDateInRange(date, assignment.startDate, assignment.endDate)
    );
  };

  return (
    <div className="border-t border-zinc-800/50" ref={timelineRef}>
      <div className="p-4 flex flex-col items-center gap-2">
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

      <div className="p-4">
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
        <div className="grid grid-cols-14 gap-1 mb-4">
          {days.map((day) => (
            <div 
              key={`weekday-${day.toISOString()}`} 
              className={`text-xs ${isWeekend(day) ? 'text-red-400/70' : 'text-zinc-400'} text-center`}
            >
              {format(day, 'EEEEE')}
            </div>
          ))}
        </div>
        
        {selectedEquipment.length > 0 ? (
          selectedEquipment.map((equipment) => (
            <div key={equipment.id} className="mb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium truncate">{equipment.name}</span>
              </div>
              <div className="grid grid-cols-14 gap-1">
                {days.map((day) => {
                  const assignments = getAssignmentsForDay(equipment.id, day);
                  const isAssigned = assignments.length > 0;
                  
                  return (
                    <div 
                      key={day.toISOString()} 
                      className="h-3 bg-zinc-800/50 rounded-sm relative"
                    >
                      {isAssigned && (
                        <div 
                          className="absolute top-0 left-0 h-full bg-blue-500/50 rounded-sm w-full"
                          title={assignments.map(a => a.projectName).join(', ')}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-zinc-400">
            Select equipment to view their timeline
          </div>
        )}
      </div>
    </div>
  );
}
