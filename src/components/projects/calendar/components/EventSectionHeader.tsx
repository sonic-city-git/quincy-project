import { Brush, Package, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventStatusManager } from "../EventStatusManager";
import { CalendarEvent } from "@/types/events";
import { formatPrice } from "@/utils/priceFormatters";

interface EventSectionHeaderProps {
  status: string;
  events: CalendarEvent[];
  sectionIcon: React.ReactNode;
  sectionSyncStatus: 'synced' | 'out-of-sync' | 'no-equipment';
  totalPrice: number;
  canSync: boolean;
  isSyncing: boolean;
  handleSyncCrew: () => Promise<void>;
  onStatusChange: (event: CalendarEvent, newStatus: CalendarEvent['status']) => void;
  isCancelled: boolean;
}

export function EventSectionHeader({
  status,
  events,
  sectionIcon,
  sectionSyncStatus,
  totalPrice,
  canSync,
  isSyncing,
  handleSyncCrew,
  onStatusChange,
  isCancelled
}: EventSectionHeaderProps) {
  const iconContainerClasses = "h-10 w-10 flex items-center justify-center";
  const iconClasses = "h-6 w-6";

  return (
    <div className="p-3">
      <div className="grid grid-cols-[100px_165px_30px_30px_30px_1fr_100px] gap-2 items-center">
        <div className="flex items-center gap-2">
          {sectionIcon}
          <h3 className="text-lg font-semibold whitespace-nowrap">
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </h3>
        </div>
        
        <div /> {/* Empty space for name column */}
        
        <div /> {/* Empty space for location column */}

        <div className="flex items-center justify-center">
          {canSync && (
            <div className={iconContainerClasses}>
              {sectionSyncStatus === 'no-equipment' ? (
                <Package className={`${iconClasses} text-muted-foreground`} />
              ) : sectionSyncStatus === 'out-of-sync' ? (
                <Package className={`${iconClasses} text-blue-500`} />
              ) : (
                <Package className={`${iconClasses} text-green-500`} />
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-center">
          {canSync && (
            <Button
              variant="ghost"
              size="icon"
              className={iconContainerClasses}
              onClick={handleSyncCrew}
              disabled={isSyncing}
            >
              <Users className={`${iconClasses} text-muted-foreground hover:text-foreground`} />
            </Button>
          )}
        </div>

        <div className="flex items-center justify-end">
          <EventStatusManager
            status={status}
            events={events}
            onStatusChange={onStatusChange}
            isCancelled={isCancelled}
          />
        </div>

        <div className="flex items-center justify-end text-sm">
          {formatPrice(totalPrice)}
        </div>
      </div>
    </div>
  );
}