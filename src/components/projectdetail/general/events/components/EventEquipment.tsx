/**
 * 🎯 EVENT EQUIPMENT COMPONENT
 * 
 * Handles equipment sync status and actions for events
 * Based on original: EquipmentIcon + BaseEquipmentIcon + EquipmentDifferenceDialog
 */

import React, { useState } from 'react';
import { Package } from 'lucide-react';
import { EquipmentDifferenceDialog } from '../dialogs/EquipmentDifferenceDialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CalendarEvent } from '@/types/events';
import { useEquipmentSync } from '@/hooks/useEquipmentSync';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EquipmentItem {
  id: string;
  quantity: number;
  equipment: {
    name: string;
    code: string | null;
  };
  group: {
    name: string;
  } | null;
}

interface EquipmentDifference {
  added: EquipmentItem[];
  removed: EquipmentItem[];
  changed: {
    item: EquipmentItem;
    oldQuantity: number;
    newQuantity: number;
  }[];
}

export interface EventEquipmentProps {
  event?: CalendarEvent;
  events?: CalendarEvent[];
  variant?: 'icon' | 'section';
  isSynced?: boolean;
  hasProjectEquipment?: boolean;
  disabled?: boolean;
  className?: string;
  onSync?: (eventIds: string[]) => void;
}



export function EventEquipment({
  event,
  events = [],
  variant = 'icon',
  isSynced,
  hasProjectEquipment,
  disabled = false,
  className,
  onSync
}: EventEquipmentProps) {
  const { syncEvent, syncEvents, isSyncing } = useEquipmentSync();
  const [showDifferences, setShowDifferences] = useState(false);
  const [differences, setDifferences] = useState<EquipmentDifference>({
    added: [],
    removed: [],
    changed: []
  });
  
  const targetEvent = event || events[0];
  const targetEvents = events.length > 0 ? events : (targetEvent ? [targetEvent] : []);
  
  // Don't render if no equipment needed or no project equipment
  if (!targetEvent?.type?.needs_equipment || !hasProjectEquipment) {
    return null;
  }

  const isMultiple = targetEvents.length > 1;
  const isEquipmentSynced = isSynced ?? false;

  const handleSync = async () => {
    console.log('🎯 handleSync called for event:', targetEvent.id);
    await syncEvent(targetEvent.id, targetEvent.project_id);
    onSync?.([targetEvent.id]);
  };

  const fetchDifferences = async () => {
    try {
      const { data: projectEquipment } = await supabase
        .from('project_equipment')
        .select(`
          equipment_id,
          quantity,
          group_id,
          equipment:equipment (
            name,
            code
          ),
          group:project_equipment_groups (
            name
          )
        `)
        .eq('project_id', targetEvent.project_id);

      const { data: eventEquipment } = await supabase
        .from('project_event_equipment')
        .select(`
          equipment_id,
          quantity,
          group_id,
          equipment:equipment (
            name,
            code
          ),
          group:project_equipment_groups (
            name
          )
        `)
        .eq('event_id', targetEvent.id);

      const projectMap = new Map(projectEquipment?.map(item => [item.equipment_id, item]) || []);
      const eventMap = new Map(eventEquipment?.map(item => [item.equipment_id, item]) || []);

      const added: EquipmentItem[] = [];
      const removed: EquipmentItem[] = [];
      const changed: EquipmentDifference['changed'] = [];

      projectMap.forEach((projectItem, equipId) => {
        const eventItem = eventMap.get(equipId);
        
        if (!eventItem) {
          added.push({
            id: equipId,
            equipment: projectItem.equipment,
            quantity: projectItem.quantity,
            group: projectItem.group
          });
        } else if (eventItem.quantity !== projectItem.quantity) {
          changed.push({
            item: {
              id: equipId,
              equipment: projectItem.equipment,
              quantity: eventItem.quantity,
              group: projectItem.group
            },
            oldQuantity: eventItem.quantity,
            newQuantity: projectItem.quantity
          });
        }
      });

      eventMap.forEach((eventItem, equipId) => {
        if (!projectMap.has(equipId)) {
          removed.push({
            id: equipId,
            equipment: eventItem.equipment,
            quantity: eventItem.quantity,
            group: eventItem.group
          });
        }
      });

      setDifferences({ added, removed, changed });
    } catch (error) {
      console.error('Error fetching differences:', error);
      toast.error("Failed to fetch equipment differences");
    }
  };

  const handleViewDifferences = () => {
    setShowDifferences(true);
    fetchDifferences();
  };

  // If synced, show simple icon
  if (isEquipmentSynced) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="h-10 w-10 flex items-center justify-center">
            <Package className="h-5 w-5 text-green-500" />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Equipment is synced</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Interactive icon with dropdown
  return (
    <>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 p-0"
                disabled={disabled}
              >
                <Package className={`h-5 w-5 ${isSyncing ? 'text-orange-500 animate-pulse' : 'text-blue-500'}`} />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isSyncing ? "Syncing equipment..." : "Equipment out of sync"}</p>
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="start">
          {!isMultiple && (
            <DropdownMenuItem onClick={handleViewDifferences}>
              View differences
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleSync}>
            Sync equipment
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EquipmentDifferenceDialog
        isOpen={showDifferences}
        onOpenChange={setShowDifferences}
        equipmentDifference={differences}
      />
    </>
  );
}