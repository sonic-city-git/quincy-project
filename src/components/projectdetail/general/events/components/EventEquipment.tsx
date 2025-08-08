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
import { useUnifiedEventSync } from '@/hooks/useUnifiedEventSync';
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
  const [showDifferences, setShowDifferences] = useState(false);
  const [differences, setDifferences] = useState<EquipmentDifference>({
    added: [],
    removed: [],
    changed: []
  });
  
  const targetEvent = event || (events.length > 0 ? events[0] : null);
  const { actions: syncActions, isSyncing } = useUnifiedEventSync(targetEvent);
  const targetEvents = events.length > 0 ? events : (targetEvent ? [targetEvent] : []);
  
  // Don't render if no equipment needed, no project equipment, or no valid event
  if (!targetEvent?.type?.needs_equipment || !hasProjectEquipment || !targetEvent.id) {
    return null;
  }

  const isMultiple = targetEvents.length > 1;
  const isEquipmentSynced = isSynced ?? false;

  const handleSync = async () => {
    console.log('🎯 handleSync called for event:', targetEvent.id);
    await syncActions.syncEquipment();
    onSync?.([targetEvent.id]);
  };

  const fetchDifferences = async () => {
    try {
      const differences = await syncActions.fetchEquipmentDifferences();
      setDifferences(differences);
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