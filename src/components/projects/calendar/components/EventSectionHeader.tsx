import { HelpCircle, CheckCircle, Send, XCircle, Package, Users } from "lucide-react";
import { EventType } from "@/types/events";

interface EventSectionHeaderProps {
  title: string;
  eventCount: number;
  eventType?: EventType;
}

export function EventSectionHeader({ title, eventCount, eventType }: EventSectionHeaderProps) {
  const getStatusIcon = () => {
    switch (title.toLowerCase()) {
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'invoice ready':
        return <Send className="h-5 w-5 text-blue-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default: // 'proposed'
        return <HelpCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <h3 className="text-lg font-semibold">{title}</h3>
        <span className="text-sm text-muted-foreground">({eventCount})</span>
      </div>
      {eventType && (
        <div className="flex items-center gap-2">
          {eventType.needs_equipment && (
            <Package className="h-4 w-4 text-muted-foreground" />
          )}
          {eventType.needs_crew && (
            <Users className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      )}
    </div>
  );
}