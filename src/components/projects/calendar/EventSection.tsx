import { Brush, ChevronDown, Package, Users, MapPin, CheckCircle, Send, DollarSign, XCircle, HelpCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarEvent } from "@/types/events";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { EventSectionHeader } from "./components/EventSectionHeader";
import { EventSectionContent } from "./components/EventSectionContent";

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
    <div className="h-6 w-6 flex items-center justify-center">
      {getStatusIcon(status)}
    </div>
  );

  // Calculate total price for all events in this section
  const totalPrice = events.reduce((sum, event) => sum + (event.revenue || 0), 0);

  const handleSyncCrew = async () => {
    try {
      setIsSyncing(true);
      // Get all events that need crew in this section
      const eventsNeedingCrew = events.filter(event => event.type.needs_crew);
      
      if (eventsNeedingCrew.length === 0) {
        toast.info('No events in this section need crew');
        return;
      }

      // For each event, sync the crew roles from the project
      for (const event of eventsNeedingCrew) {
        const { data: projectRoles } = await supabase
          .from('project_roles')
          .select('*')
          .eq('project_id', event.project_id);

        if (projectRoles && projectRoles.length > 0) {
          // Delete existing event roles
          await supabase
            .from('project_event_roles')
            .delete()
            .eq('event_id', event.id);

          // Create new event roles based on project roles
          const eventRoles = projectRoles.map(role => ({
            project_id: event.project_id,
            event_id: event.id,
            role_id: role.role_id,
            daily_rate: role.daily_rate,
            hourly_rate: role.hourly_rate
          }));

          await supabase
            .from('project_event_roles')
            .upsert(eventRoles);
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['project-event-roles'] });
      toast.success('Crew roles synchronized successfully');
    } catch (error) {
      console.error('Error syncing crew:', error);
      toast.error('Failed to sync crew roles');
    } finally {
      setIsSyncing(false);
    }
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
      case 'confirmed':
      case 'invoice ready':
      case 'cancelled':
        return 'bg-zinc-800/45 hover:bg-zinc-800/50';
      default:
        return 'bg-zinc-800/45 hover:bg-zinc-800/50';
    }
  };

  if (isDoneAndDusted) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className={`rounded-lg ${getStatusBackground(status)}`}>
          <CollapsibleTrigger className="flex items-center justify-between w-full group p-4">
            <div className="flex items-center gap-2">
              {sectionIcon}
              <h3 className="text-lg font-semibold whitespace-nowrap">Done and Dusted</h3>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''} ml-2`} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <EventSectionContent
              events={events}
              onStatusChange={onStatusChange}
              onEdit={onEdit}
            />
          </CollapsibleContent>
        </div>
      </Collapsible>
    );
  }

  return (
    <div className="space-y-3">
      <div className={`rounded-lg ${getStatusBackground(status)}`}>
        <div className="p-4">
          <EventSectionHeader
            status={status}
            events={events}
            sectionIcon={sectionIcon}
            sectionSyncStatus={sectionSyncStatus}
            totalPrice={totalPrice}
            canSync={canSync}
            isSyncing={isSyncing}
            handleSyncCrew={handleSyncCrew}
            onStatusChange={onStatusChange}
            isCancelled={isCancelled}
          />
        </div>
        <EventSectionContent
          events={events}
          onStatusChange={onStatusChange}
          onEdit={onEdit}
        />
      </div>
    </div>
  );
}

function getStatusIcon(status: string) {
  switch (status.toLowerCase()) {
    case 'confirmed':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'invoice ready':
      return <Send className="h-5 w-5 text-blue-500" />;
    case 'invoiced':
      return <DollarSign className="h-5 w-5 text-emerald-500" />;
    case 'cancelled':
      return <XCircle className="h-5 w-5 text-red-500" />;
    default: // 'proposed'
      return <HelpCircle className="h-5 w-5 text-yellow-500" />;
  }
}
