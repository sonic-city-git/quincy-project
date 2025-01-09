import { format, isWeekend } from "date-fns";
import { PROJECT_ASSIGNMENTS } from "./timelineConstants";

interface TimelineGridProps {
  days: Date[];
  selectedCrew: Array<{
    id: string;
    name: string;
  }>;
}

export function TimelineGrid({ days, selectedCrew }: TimelineGridProps) {
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
      
      <div className="flex-1 overflow-y-auto px-4">
        {selectedCrew.length > 0 ? (
          <div className="space-y-4 py-4">
            {selectedCrew.map((crew) => (
              <div key={crew.id}>
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
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-zinc-400">
            Select crew members to view their timeline
          </div>
        )}
      </div>
    </div>
  );
}