import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { CalendarEvent } from "@/types/events";

interface EventCardProps {
  event: CalendarEvent;
  onEdit?: (event: CalendarEvent) => void;
}

export function EventCard({ event, onEdit }: EventCardProps) {
  const iconClasses = "h-5 w-5 flex-shrink-0";
  
  const handleDoubleClick = () => {
    if (onEdit) {
      onEdit(event);
    }
  };
  
  return (
    <>
      <div 
        className="flex items-center gap-2 cursor-pointer" 
        onDoubleClick={handleDoubleClick}
      >
        <Calendar className={`${iconClasses} text-muted-foreground`} />
        <span className="text-sm text-muted-foreground">
          {format(event.date, 'dd.MM.yy')}
        </span>
      </div>
      
      <div 
        className="flex flex-col justify-center cursor-pointer" 
        onDoubleClick={handleDoubleClick}
      >
        <div className="flex items-center">
          <span className="font-medium text-base truncate">
            {event.name}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        {event.location && (
          <div className="flex items-center text-muted-foreground">
            <span className="text-sm truncate">{event.location}</span>
          </div>
        )}
      </div>
    </>
  );
}