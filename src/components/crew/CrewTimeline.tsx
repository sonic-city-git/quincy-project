import { format, eachDayOfInterval, addDays, getWeek } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

// Mock project assignments - in a real app, this would come from your backend
const PROJECT_ASSIGNMENTS = {
  "1": [ // Crew member ID
    { startDate: "2024-03-20", endDate: "2024-03-25", projectName: "Project A" },
    { startDate: "2024-04-01", endDate: "2024-04-05", projectName: "Project B" }
  ],
  "2": [
    { startDate: "2024-03-22", endDate: "2024-03-24", projectName: "Project C" }
  ],
  "3": [
    { startDate: "2024-03-28", endDate: "2024-04-02", projectName: "Project D" }
  ]
};

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

  const endDate = addDays(startDate, daysToShow - 1);
  const startWeek = getWeek(startDate);
  const endWeek = getWeek(endDate);

  const isDateInRange = (date: Date, startDateStr: string, endDateStr: string) => {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    return date >= start && date <= end;
  };

  const getAssignmentsForDay = (crewId: string, date: Date) => {
    const assignments = PROJECT_ASSIGNMENTS[crewId] || [];
    return assignments.filter(assignment => 
      isDateInRange(date, assignment.startDate, assignment.endDate)
    );
  };

  return (
    <div className="border-t border-zinc-800/50">
      <div className="p-4 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onPreviousPeriod}>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onPreviousPeriod}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            {format(startDate, 'dd MMM yyyy')} - {format(endDate, 'dd MMM yyyy')}
          </span>
          <Button variant="ghost" size="sm" onClick={onNextPeriod}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onNextPeriod}>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-sm text-zinc-400">
          Week {startWeek}{startWeek !== endWeek ? ` - ${endWeek}` : ''}
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
                {days.map((day) => {
                  const assignments = getAssignmentsForDay(crew.id, day);
                  const isAssigned = assignments.length > 0;
                  
                  return (
                    <div 
                      key={day.toISOString()} 
                      className="h-3 bg-zinc-800/50 rounded-sm relative group"
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
            Select crew members to view their timeline
          </div>
        )}
      </div>
    </div>
  );
}