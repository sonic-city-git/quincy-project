import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { CalendarEvent } from "@/types/events";

interface CalendarDayProps {
  date: Date;
  event?: CalendarEvent;
}

export function CalendarDay({ date, event }: CalendarDayProps) {
  if (!event) {
    return <div className="w-full h-full flex items-center justify-center">{date.getDate()}</div>;
  }

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div 
          className="w-full h-full flex items-center justify-center relative"
          style={{
            backgroundColor: `${event.type.color}D9`, // D9 in hex is 85% opacity
            color: '#FFFFFF' // White text, fully opaque
          }}
        >
          {date.getDate()}
        </div>
      </HoverCardTrigger>
      <HoverCardContent 
        align="center"
        side="top"
        sideOffset={5}
        className="z-[100] bg-zinc-950 border border-zinc-800 text-white p-3 rounded-md shadow-xl w-[200px]"
      >
        <div className="space-y-1.5">
          <p className="font-semibold text-white">{event.name}</p>
          <p className="text-sm text-zinc-300">{event.type.name}</p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}