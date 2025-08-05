import { CalendarEvent } from "@/types/events";
import { CheckCircle, HelpCircle, Send, XCircle } from "lucide-react";

interface StatusIconProps {
  status: CalendarEvent['status'];
  events?: CalendarEvent[];
}

export function StatusIcon({ status }: StatusIconProps) {
  // Simple status colors - no warning logic, handled by equipment/crew icons
  const renderIcon = () => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'proposed':
        return <HelpCircle className="h-5 w-5 text-yellow-500" />;
      case 'invoice ready':
        return <Send className="h-5 w-5 text-blue-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <HelpCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  return (
    <div className="flex items-center justify-center">
      {renderIcon()}
    </div>
  );
}