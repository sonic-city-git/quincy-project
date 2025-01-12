import { CalendarEvent } from "@/types/events";
import { Card } from "@/components/ui/card";
import { Calendar, Edit, MapPin, Package, Users } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getStatusIcon } from "@/utils/eventFormatters";
import { EVENT_COLORS } from "@/constants/eventColors";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect, useCallback } from 'react';

interface EventCardProps {
  event: CalendarEvent;
  onStatusChange: (event: CalendarEvent, newStatus: CalendarEvent['status']) => void;
  onEdit?: (event: CalendarEvent) => void;
}

export function EventCard({ event, onStatusChange, onEdit }: EventCardProps) {
  const [isSynced, setIsSynced] = useState(true);
  const [hasEventEquipment, setHasEventEquipment] = useState(false);
  const [hasProjectEquipment, setHasProjectEquipment] = useState(false);

  // Fetch initial sync status and equipment status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        // Check project equipment
        const { data: projectEquipment } = await supabase
          .from('project_equipment')
          .select('id')
          .eq('project_id', event.project_id)
          .limit(1);
        
        setHasProjectEquipment(!!projectEquipment?.length);

        // Check event equipment and sync status
        const { data: eventEquipment, error } = await supabase
          .from('project_event_equipment')
          .select('*')
          .eq('event_id', event.id);

        if (!error) {
          const hasEquipment = eventEquipment && eventEquipment.length > 0;
          setHasEventEquipment(hasEquipment);
          setIsSynced(hasEquipment ? eventEquipment.every(item => item.is_synced) : true);
        } else {
          console.error('Error fetching equipment status:', error);
          setHasEventEquipment(false);
          setIsSynced(true);
        }
      } catch (error) {
        console.error('Error in fetchStatus:', error);
        setHasEventEquipment(false);
        setIsSynced(true);
      }
    };

    if (event.type.needs_equipment) {
      fetchStatus();
    }
  }, [event.id, event.project_id, event.type.needs_equipment]);

  const handleEquipmentOption = async () => {
    try {
      // First, fetch all project equipment
      const { data: projectEquipment, error: fetchError } = await supabase
        .from('project_equipment')
        .select('*')
        .eq('project_id', event.project_id);

      if (fetchError) throw fetchError;

      // Delete existing event equipment
      const { error: deleteError } = await supabase
        .from('project_event_equipment')
        .delete()
        .eq('event_id', event.id);

      if (deleteError) throw deleteError;

      // Insert new equipment records using upsert
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
          .upsert(eventEquipment, {
            onConflict: 'event_id,equipment_id',
            ignoreDuplicates: true
          });

        if (upsertError) throw upsertError;
      }

      setIsSynced(true);
      toast.success('Equipment list synchronized successfully');
    } catch (error) {
      console.error('Error syncing equipment:', error);
      toast.error('Failed to sync equipment list');
    }
  };

  const viewOutOfSyncEquipment = async () => {
    try {
      const { data: eventEquipment, error } = await supabase
        .from('project_event_equipment')
        .select(`
          *,
          equipment:equipment_id (
            name,
            code
          )
        `)
        .eq('event_id', event.id)
        .eq('is_synced', false);

      if (error) throw error;

      if (eventEquipment && eventEquipment.length > 0) {
        const equipmentList = eventEquipment.map(item => 
          `${item.equipment.name}${item.equipment.code ? ` (${item.equipment.code})` : ''}`
        ).join('\n');
        
        toast.info('Out of sync equipment:', {
          description: equipmentList,
          duration: 5000,
        });
      } else {
        toast.info('No out of sync equipment found');
      }
    } catch (error) {
      console.error('Error fetching out of sync equipment:', error);
      toast.error('Failed to fetch equipment list');
    }
  };

  const getEquipmentIcon = useCallback(() => {
    if (!event.type.needs_equipment) return null;
    
    if (!hasEventEquipment && !hasProjectEquipment) {
      return <Package className="h-6 w-6 text-muted-foreground" />;
    }
    
    return (
      <Package 
        className={`h-6 w-6 ${hasEventEquipment && isSynced ? 'text-green-500' : 'text-blue-500'}`}
      />
    );
  }, [event.type.needs_equipment, hasEventEquipment, hasProjectEquipment, isSynced]);

  return (
    <Card key={`${event.date}-${event.name}`} className="p-4">
      <div className="grid grid-cols-[120px_1fr_40px_40px_1fr_auto] gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {format(event.date, 'dd.MM.yy')}
          </span>
        </div>
        
        <div className="flex flex-col">
          <div className="flex items-start">
            <span className="font-medium text-base">
              {event.name}
            </span>
          </div>
          {event.location && (
            <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{event.location}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center">
          {event.type.needs_equipment && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 p-0"
                >
                  {getEquipmentIcon()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {!isSynced && hasEventEquipment ? (
                  <>
                    <DropdownMenuItem onClick={viewOutOfSyncEquipment}>
                      View out of sync equipment list
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleEquipmentOption}>
                      Sync to project equipment list
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem onClick={handleEquipmentOption}>
                    Assign project equipment list
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="flex items-center justify-center">
          {event.type.needs_crew && (
            <Users className="h-6 w-6 text-muted-foreground" />
          )}
        </div>

        <div className="flex items-center">
          <span 
            className={`text-sm px-2 py-1 rounded-md ${EVENT_COLORS[event.type.name]}`}
          >
            {event.type.name}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="flex items-center gap-2"
              >
                {getStatusIcon(event.status)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => onStatusChange(event, 'proposed')}
                className="flex items-center gap-2"
              >
                {getStatusIcon('proposed')}
                Proposed
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onStatusChange(event, 'confirmed')}
                className="flex items-center gap-2"
              >
                {getStatusIcon('confirmed')}
                Confirmed
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onStatusChange(event, 'invoice ready')}
                className="flex items-center gap-2"
              >
                {getStatusIcon('invoice ready')}
                Invoice Ready
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onStatusChange(event, 'cancelled')}
                className="flex items-center gap-2"
              >
                {getStatusIcon('cancelled')}
                Cancelled
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(event)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}