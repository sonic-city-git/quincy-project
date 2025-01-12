import { CalendarEvent } from "@/types/events";
import { getStatusIcon } from "@/utils/eventFormatters";
import { EventCard } from "./EventCard";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Brush, ChevronDown, Package, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { EventStatusManager } from "./EventStatusManager";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EventSectionProps {
  status: CalendarEvent['status'] | 'done and dusted';
  events: CalendarEvent[];
  onStatusChange: (event: CalendarEvent, newStatus: CalendarEvent['status']) => void;
  onEdit?: (event: CalendarEvent) => void;
}

export function EventSection({ status, events, onStatusChange, onEdit }: EventSectionProps) {
  const [isOpen, setIsOpen] = useState(status !== 'done and dusted');
  const [isSyncing, setIsSyncing] = useState(false);
  const [sectionSyncStatus, setSectionSyncStatus] = useState<'synced' | 'out-of-sync' | 'no-equipment'>('no-equipment');
  const queryClient = useQueryClient();

  const isDoneAndDusted = status === 'done and dusted';
  const isCancelled = status === 'cancelled';
  const canSync = status === 'proposed' || status === 'confirmed';

  const sectionIcon = isDoneAndDusted ? (
    <Brush className="h-6 w-6 text-gray-400" />
  ) : (
    getStatusIcon(status, 24)  // Increased size to match the design
  );

  const getSectionEquipmentIcon = () => {
    if (sectionSyncStatus === 'no-equipment') {
      return <Package className="h-6 w-6 text-muted-foreground" />;
    }
    if (sectionSyncStatus === 'out-of-sync') {
      return <Package className="h-6 w-6 text-blue-500" />;
    }
    return <Package className="h-6 w-6 text-green-500" />;
  };

  // Calculate total price for all events in this section
  const totalPrice = events.reduce((sum, event) => sum + (event.revenue || 0), 0);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount).replace('NOK', 'kr').replace('.', ',');
  };

  useEffect(() => {
    const checkSectionSyncStatus = async () => {
      const eventsWithEquipment = events.filter(event => event.type.needs_equipment);
      
      if (eventsWithEquipment.length === 0) {
        setSectionSyncStatus('no-equipment');
        return;
      }

      try {
        const promises = eventsWithEquipment.map(async (event) => {
          const { data: eventEquipment } = await supabase
            .from('project_event_equipment')
            .select('is_synced')
            .eq('event_id', event.id);

          return {
            hasEquipment: eventEquipment && eventEquipment.length > 0,
            isSynced: eventEquipment?.every(item => item.is_synced)
          };
        });

        const results = await Promise.all(promises);
        const hasAnyEquipment = results.some(r => r.hasEquipment);
        const allSynced = results.every(r => r.isSynced);

        setSectionSyncStatus(hasAnyEquipment ? (allSynced ? 'synced' : 'out-of-sync') : 'no-equipment');
      } catch (error) {
        console.error('Error checking section sync status:', error);
        setSectionSyncStatus('no-equipment');
      }
    };

    checkSectionSyncStatus();

    const channels = events.map(event => {
      return supabase
        .channel(`section-equipment-${event.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'project_event_equipment',
          filter: `event_id=eq.${event.id}`
        }, () => {
          checkSectionSyncStatus();
        })
        .subscribe();
    });

    return () => {
      channels.forEach(channel => channel.unsubscribe());
    };
  }, [events]);

  const getStatusBackground = (status: string) => {
    switch (status) {
      case 'proposed':
        return 'bg-zinc-800/45 hover:bg-zinc-800/50';
      case 'confirmed':
        return 'bg-zinc-800/45 hover:bg-zinc-800/50';
      case 'invoice ready':
        return 'bg-zinc-800/45 hover:bg-zinc-800/50';
      case 'cancelled':
        return 'bg-zinc-800/45 hover:bg-zinc-800/50';
      default:
        return 'bg-zinc-800/45 hover:bg-zinc-800/50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'invoice ready':
        return 'Invoice Ready';
      case 'cancelled':
        return 'Cancelled';
      case 'done and dusted':
        return 'Done and Dusted';
      default:
        return `${status.charAt(0).toUpperCase()}${status.slice(1)}`;
    }
  };

  if (isDoneAndDusted) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className={`rounded-lg ${getStatusBackground(status)}`}>
          <CollapsibleTrigger className="flex items-center justify-between w-full group p-4">
            <div className="flex items-center gap-2">
              {sectionIcon}
              <h3 className="text-lg font-semibold whitespace-nowrap">{getStatusText(status)}</h3>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''} ml-2`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 pb-4">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onStatusChange={onStatusChange}
                onEdit={onEdit}
              />
            ))}
          </CollapsibleContent>
        </div>
      </Collapsible>
    );
  }

  return (
    <div className="space-y-3">
      <div className={`rounded-lg ${getStatusBackground(status)}`}>
        <div className="p-4">
          <div className="grid grid-cols-[100px_minmax(100px,200px)_30px_30px_1fr_100px_40px_40px] gap-0 items-center">
            <div className="flex items-center gap-2">
              {sectionIcon}
              <h3 className="text-lg font-semibold whitespace-nowrap">{getStatusText(status)}</h3>
            </div>
            
            <div /> {/* Empty space for name column */}
            
            <div className="flex items-center justify-center -ml-8">
              {canSync ? getSectionEquipmentIcon() : <div />}
            </div>

            <div className="flex items-center justify-center -ml-6">
              {canSync ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 p-0"
                  onClick={handleSyncCrew}
                  disabled={isSyncing}
                >
                  <Users className="h-6 w-6 text-muted-foreground hover:text-foreground" />
                </Button>
              ) : (
                <div />
              )}
            </div>

            <div className="ml-5" /> {/* Empty space for event type column */}

            <div className="flex items-center justify-end text-sm font-medium">
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
        <div className="px-4 pb-4">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onStatusChange={onStatusChange}
              onEdit={onEdit}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
