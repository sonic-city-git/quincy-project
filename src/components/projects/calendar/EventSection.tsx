import { CalendarEvent } from "@/types/events";
import { getStatusIcon } from "@/utils/eventFormatters";
import { EventCard } from "./EventCard";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Package, Users } from "lucide-react";
import { useState } from "react";
import { EventStatusManager } from "./EventStatusManager";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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

  if (!events.length) return null;

  const sectionIcon = getStatusIcon(status === 'done and dusted' ? 'invoiced' : status);
  const isDoneAndDusted = status === 'done and dusted';
  const isCancelled = status === 'cancelled';
  const canSync = status === 'proposed' || status === 'confirmed';

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
    return `${status.charAt(0).toUpperCase()}${status.slice(1)}`;
  };

  const handleSyncEquipment = async () => {
    if (!canSync || isSyncing) return;
    setIsSyncing(true);

    try {
      for (const event of events) {
        // Delete existing equipment for the event
        const { error: deleteError } = await supabase
          .from('project_event_equipment')
          .delete()
          .eq('event_id', event.id);

        if (deleteError) throw deleteError;

        // Get project equipment
        const { data: projectEquipment, error: fetchError } = await supabase
          .from('project_equipment')
          .select('*')
          .eq('project_id', event.project_id);

        if (fetchError) throw fetchError;

        if (projectEquipment && projectEquipment.length > 0) {
          const eventEquipment = projectEquipment.map(item => ({
            project_id: event.project_id,
            event_id: event.id,
            equipment_id: item.equipment_id,
            quantity: item.quantity,
            group_id: item.group_id,
            is_synced: true
          }));

          const { error: upsertError } = await supabase
            .from('project_event_equipment')
            .upsert(eventEquipment);

          if (upsertError) throw upsertError;
        }
      }

      toast.success('Equipment synchronized for all events');
    } catch (error) {
      console.error('Error syncing equipment:', error);
      toast.error('Failed to sync equipment');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncCrew = async () => {
    if (!canSync || isSyncing) return;
    setIsSyncing(true);

    try {
      for (const event of events) {
        // Delete existing roles for the event
        const { error: deleteError } = await supabase
          .from('project_event_roles')
          .delete()
          .eq('event_id', event.id);

        if (deleteError) throw deleteError;

        // Get project roles
        const { data: projectRoles, error: fetchError } = await supabase
          .from('project_roles')
          .select('*')
          .eq('project_id', event.project_id);

        if (fetchError) throw fetchError;

        if (projectRoles && projectRoles.length > 0) {
          const eventRoles = projectRoles.map(role => ({
            project_id: event.project_id,
            event_id: event.id,
            role_id: role.role_id,
            crew_member_id: role.preferred_id,
            daily_rate: role.daily_rate,
            hourly_rate: role.hourly_rate
          }));

          const { error: upsertError } = await supabase
            .from('project_event_roles')
            .upsert(eventRoles);

          if (upsertError) throw upsertError;
        }
      }

      toast.success('Crew synchronized for all events');
    } catch (error) {
      console.error('Error syncing crew:', error);
      toast.error('Failed to sync crew');
    } finally {
      setIsSyncing(false);
    }
  };

  const content = (
    <div className="space-y-2">
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          onStatusChange={onStatusChange}
          onEdit={onEdit}
        />
      ))}
    </div>
  );

  if (isDoneAndDusted) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className={`rounded-lg ${getStatusBackground(status)}`}>
          <CollapsibleTrigger className="flex items-center justify-between w-full group p-4">
            <div className="flex items-center gap-2">
              {sectionIcon}
              <h3 className="text-lg font-semibold">{getStatusText(status)}</h3>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''} ml-2`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 pb-4">
            {content}
          </CollapsibleContent>
        </div>
      </Collapsible>
    );
  }

  return (
    <div className="space-y-3">
      <div className={`rounded-lg ${getStatusBackground(status)}`}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            {sectionIcon}
            <h3 className="text-lg font-semibold">{getStatusText(status)}</h3>
          </div>
          <div className="flex items-center gap-4">
            {canSync && (
              <TooltipProvider>
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleSyncEquipment}
                        disabled={isSyncing}
                      >
                        <Package className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Sync equipment with project list
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleSyncCrew}
                        disabled={isSyncing}
                      >
                        <Users className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Sync crew with project list
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
            )}
            <EventStatusManager
              status={status}
              events={events}
              onStatusChange={onStatusChange}
              isCancelled={isCancelled}
            />
          </div>
        </div>
        <div className="px-4 pb-4">
          {content}
        </div>
      </div>
    </div>
  );
}