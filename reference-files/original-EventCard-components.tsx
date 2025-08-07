import { Calendar } from "lucide-react";
import { formatDisplayDate } from "@/utils/dateFormatters";
import { CalendarEvent } from "@/types/events";

interface EventCardProps {
  event: CalendarEvent;
  onEdit?: (event: CalendarEvent) => void;
}

export function EventCard({ event, onEdit }: EventCardProps) {
  const iconClasses = "h-5 w-5 flex-shrink-0";
  
  const handleClick = () => {
    if (onEdit) {
  
      onEdit(event);
    }
  };
  
  return (
    <>
      <div 
        className="flex items-center gap-2 hover:text-primary cursor-pointer select-none" 
        onClick={handleClick}
      >
        <Calendar className={`${iconClasses} text-muted-foreground`} />
        <span className="text-sm text-muted-foreground">
          {formatDisplayDate(event.date)}
        </span>
      </div>
      
      <div 
        className="flex flex-col justify-center hover:text-primary cursor-pointer select-none" 
        onClick={handleClick}
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