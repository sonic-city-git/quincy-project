import { Brush, ChevronDown, Package, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventStatusManager } from "../EventStatusManager";
import { CalendarEvent } from "@/types/events";

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
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace('NOK', 'kr').replace('.', ',');
  };

  const iconContainerClasses = "h-10 w-10 flex items-center justify-center";
  const iconClasses = "h-6 w-6";

  const getSectionEquipmentIcon = () => {
    if (sectionSyncStatus === 'no-equipment') {
      return <Package className={`${iconClasses} text-muted-foreground`} />;
    }
    if (sectionSyncStatus === 'out-of-sync') {
      return <Package className={`${iconClasses} text-blue-500`} />;
    }
    return <Package className={`${iconClasses} text-green-500`} />;
  };

  return (
    <div className="p-3">
      <div className="grid grid-cols-[100px_165px_30px_30px_30px_1fr_100px_40px_40px] gap-2 items-center">
        <div className="flex items-center gap-2">
          {sectionIcon}
          <h3 className="text-lg font-semibold whitespace-nowrap">
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </h3>
        </div>
        
        <div /> {/* Empty space for name column */}
        
        <div /> {/* Empty space for location column */}

        <div className="flex items-center justify-center">
          {canSync ? (
            <div className={iconContainerClasses}>
              {getSectionEquipmentIcon()}
            </div>
          ) : <div />}
        </div>

        <div className="flex items-center justify-center">
          {canSync ? (
            <Button
              variant="ghost"
              size="icon"
              className={iconContainerClasses}
              onClick={handleSyncCrew}
              disabled={isSyncing}
            >
              <Users className={`${iconClasses} text-muted-foreground hover:text-foreground`} />
            </Button>
          ) : (
            <div />
          )}
        </div>

        <div /> {/* Empty space for event type column */}

        <div className="flex items-center justify-end text-sm">
          {formatPrice(totalPrice)}
        </div>

        <div className="flex items-center justify-end col-span-2">
          <EventStatusManager
            status={status}
            events={events}
            onStatusChange={onStatusChange}
            isCancelled={isCancelled}
          />
        </div>
      </div>
    </div>
  );
}