import { eachDayOfInterval, addDays, startOfWeek } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TimelineHeader } from "./timeline/TimelineHeader";
import { TimelineGrid } from "./timeline/TimelineGrid";

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
  startDate: providedStartDate, 
  daysToShow, 
  selectedCrew,
  onPreviousPeriod,
  onNextPeriod
}: CrewTimelineProps) {
  const startDate = startOfWeek(providedStartDate, { weekStartsOn: 1 });
  const endDate = addDays(startDate, daysToShow - 1);
  
  const days = eachDayOfInterval({
    start: startDate,
    end: endDate
  });

  return (
    <div className="h-[320px] border-t border-zinc-800/50">
      <TimelineHeader 
        startDate={startDate}
        endDate={endDate}
        onPreviousPeriod={onPreviousPeriod}
        onNextPeriod={onNextPeriod}
      />

      <ScrollArea className="h-[calc(100%-3rem)]">
        <TimelineGrid days={days} selectedCrew={selectedCrew} />
      </ScrollArea>
    </div>
  );
}