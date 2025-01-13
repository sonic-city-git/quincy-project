import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { format, addDays, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";

interface TimelineItem {
  id: string;
  name: string;
  type: 'equipment' | 'crew';
  bookings: {
    id: string;
    eventId: string;
    eventName: string;
    date: Date;
    status: string;
  }[];
}

interface SchedulingTimelineProps {
  items: TimelineItem[];
  startDate?: Date;
  days?: number;
}

export function SchedulingTimeline({ 
  items, 
  startDate = new Date(), 
  days = 21 
}: SchedulingTimelineProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const baseDate = startOfDay(startDate);
  
  const toggleItem = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const dateRange = Array.from({ length: days }, (_, i) => addDays(baseDate, i));

  return (
    <div className="w-full overflow-x-auto">
      {/* Header with dates */}
      <div className="flex border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10">
        <div className="w-48 flex-shrink-0 p-2 font-medium">Resources</div>
        {dateRange.map((date) => (
          <div 
            key={date.toISOString()} 
            className="w-14 flex-shrink-0 p-1 text-center border-l border-zinc-800 text-xs"
          >
            <div className="font-medium">{format(date, 'EEE')}</div>
            <div className="text-zinc-400">{format(date, 'd')}</div>
          </div>
        ))}
      </div>

      {/* Timeline rows */}
      <div className="relative">
        {items.map((item) => (
          <div key={item.id} className="border-b border-zinc-800/50">
            {/* Item header */}
            <button
              onClick={() => toggleItem(item.id)}
              className={cn(
                "w-full flex items-center p-2 hover:bg-zinc-800/50 transition-colors",
                expandedItems.has(item.id) && "bg-zinc-800/30"
              )}
            >
              {expandedItems.has(item.id) ? (
                <ChevronDown className="h-4 w-4 mr-2" />
              ) : (
                <ChevronRight className="h-4 w-4 mr-2" />
              )}
              <span className="flex-1 text-left">{item.name}</span>
            </button>

            {/* Timeline cells */}
            <div className="flex relative">
              <div className="w-48 flex-shrink-0" />
              {dateRange.map((date) => (
                <div
                  key={date.toISOString()}
                  className="w-14 h-6 flex-shrink-0 border-l border-zinc-800/50"
                >
                  {item.bookings.some(booking => 
                    format(booking.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
                  ) && (
                    <div className="w-full h-full bg-primary/20" />
                  )}
                </div>
              ))}
            </div>

            {/* Expanded details */}
            {expandedItems.has(item.id) && (
              <div className="pl-8 pr-2 pb-2 text-sm space-y-1">
                {item.bookings.map(booking => (
                  <div 
                    key={booking.id}
                    className="flex items-center justify-between py-1 px-2 rounded bg-zinc-800/30"
                  >
                    <span>{booking.eventName}</span>
                    <span className="text-zinc-400">
                      {format(booking.date, 'MMM d, yyyy')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}