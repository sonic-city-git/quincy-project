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
        relative min-h-[60px] w-full p-2
        flex flex-col items-center justify-start gap-1
        text-sm cursor-pointer 
        hover:bg-accent/50
        transition-colors duration-200
        rounded-md
        ${className || ''} 
        ${eventType ? `${EVENT_COLORS[eventType]} text-white font-medium` : ''}
      `}
      onClick={onClick}
    >
      {children}
    </button>
  );
};