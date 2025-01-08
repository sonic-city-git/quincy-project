import { EventType } from "@/types/events";
import { EVENT_COLORS } from "@/constants/eventColors";

interface CalendarDayWrapperProps {
  children: React.ReactNode;
  eventType?: EventType;
  className?: string;
  onClick: (e: React.MouseEvent) => void;
}

export const CalendarDayWrapper = ({ 
  children, 
  eventType, 
  className, 
  onClick 
}: CalendarDayWrapperProps) => {
  return (
    <button 
      className={`
        relative h-9 w-9 p-0 font-normal 
        flex items-center justify-center text-sm 
        cursor-pointer hover:bg-accent 
        transition-colors duration-200
        rounded-md shadow-sm
        ${className || ''} 
        ${eventType ? `${EVENT_COLORS[eventType]} text-white font-medium` : ''}
      `}
      onClick={onClick}
    >
      {children}
    </button>
  );
};