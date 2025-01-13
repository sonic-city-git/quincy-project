import { CalendarEvent } from "@/types/events";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";
import { EventSectionHeaderGrid } from "./EventSectionHeaderGrid";
import { formatPrice } from "@/utils/priceFormatters";
import { useSectionSyncStatus } from "../hooks/useSectionSyncStatus";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface EventSectionHeaderProps {
  date: string;
  events: CalendarEvent[];
  revenue: number;
}

export function EventSectionHeader({ date, events, revenue }: EventSectionHeaderProps) {
  const sectionSyncStatus = useSectionSyncStatus(events);
  const queryClient = useQueryClient();

  const handleSyncEquipment = async () => {
    try {
      for (const event of events) {
        if (!event.type.needs_equipment) continue;

        const { data: projectEquipment } = await supabase
          .from('project_equipment')
          .select('*')
          .eq('project_id', event.project_id);

        if (projectEquipment && projectEquipment.length > 0) {
          const uniqueEquipment = new Map();
          
          projectEquipment.forEach(item => {
            if (uniqueEquipment.has(item.equipment_id)) {
              const existing = uniqueEquipment.get(item.equipment_id);
              existing.quantity += item.quantity;
              uniqueEquipment.set(item.equipment_id, existing);
            } else {
              uniqueEquipment.set(item.equipment_id, item);
            }
          });

          const eventEquipment = Array.from(uniqueEquipment.values()).map(item => ({
            project_id: event.project_id,
            event_id: event.id,
            equipment_id: item.equipment_id,
            quantity: item.quantity,
            group_id: item.group_id,
            is_synced: true
          }));

          const { error: deleteError } = await supabase
            .from('project_event_equipment')
            .delete()
            .eq('event_id', event.id);

          if (deleteError) throw deleteError;

          const { error: insertError } = await supabase
            .from('project_event_equipment')
            .insert(eventEquipment);

          if (insertError) throw insertError;
        }
      }

      await Promise.all([
        ...events.map(event => 
          queryClient.invalidateQueries({ queryKey: ['project-event-equipment', event.id] })
        ),
        queryClient.invalidateQueries({ queryKey: ['events', events[0]?.project_id] }),
        queryClient.invalidateQueries({ queryKey: ['calendar-events', events[0]?.project_id] })
      ]);

      toast.success('Equipment lists synchronized successfully');
    } catch (error) {
      console.error('Error syncing equipment:', error);
      toast.error('Failed to sync equipment lists');
    }
  };

  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <EventSectionHeaderGrid>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{date}</span>
        </div>

        <div className="flex justify-center items-center">
          {sectionSyncStatus !== 'no-equipment' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSyncEquipment}
              className="h-8 w-8"
            >
              <Package className={`h-6 w-6 ${
                sectionSyncStatus === 'synced' 
                  ? 'text-green-500' 
                  : 'text-blue-500'
              }`} />
            </Button>
          )}
        </div>

        <div />
        <div />
        <div />

        <div className="flex items-center justify-end text-sm font-medium">
          {formatPrice(revenue)}
        </div>

        <div />
        <div />
      </EventSectionHeaderGrid>
    </div>
  );
}