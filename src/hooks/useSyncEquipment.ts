import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export function useSyncEquipment(eventId: string, projectId: string) {
  const [isChecking, setIsChecking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const queryClient = useQueryClient();

  const checkEquipmentConflicts = async (date: string) => {
    setIsChecking(true);
    try {
      // Get equipment that will be assigned to this event
      const { data: eventEquipment } = await supabase
        .from('project_equipment')
        .select(`
          equipment_id,
          quantity,
          equipment:equipment (
            name,
            stock
          )
        `)
        .eq('project_id', projectId);

      if (!eventEquipment?.length) return [];

      const conflicts = [];
      
      for (const item of eventEquipment) {
        // Get actual equipment stock (total available across all projects)
        const equipmentStock = item.equipment?.stock || 0;
        const requestedQuantity = item.quantity || 0;

        // Check ALL equipment usage on the same date across ALL projects
        // Convert date to YYYY-MM-DD format for Supabase
        const dateString = typeof date === 'string' ? date : new Date(date).toISOString().split('T')[0];
        
        const { data: allUsageOnDate } = await supabase
          .from('project_event_equipment')
          .select(`
            quantity,
            project_events!inner (
              name,
              date,
              project:projects (
                name
              )
            )
          `)
          .eq('equipment_id', item.equipment_id)
          .eq('project_events.date', dateString)
          .neq('event_id', eventId); // Exclude current event if editing

        const totalUsageOnDate = allUsageOnDate?.reduce((sum, usage) => 
          sum + (usage.quantity || 0), 0) || 0;

        // Check if adding this event's equipment would exceed total stock
        if (totalUsageOnDate + requestedQuantity > equipmentStock) {
          const availableQuantity = Math.max(0, equipmentStock - totalUsageOnDate);
          
          conflicts.push({
            equipment: item.equipment?.name || 'Unknown Equipment',
            equipmentId: item.equipment_id,
            totalStock: equipmentStock,
            alreadyUsed: totalUsageOnDate,
            available: availableQuantity,
            needed: requestedQuantity,
            conflictingEvents: allUsageOnDate?.map(usage => ({
              eventName: usage.project_events.name,
              projectName: usage.project_events.project.name,
              quantity: usage.quantity
            })) || []
          });
        }
      }

      return conflicts;
    } finally {
      setIsChecking(false);
    }
  };

  const syncEquipment = async (date: string) => {
    console.log('🚀 [MAIN] Starting sync for event:', eventId, 'project:', projectId, 'date:', date);
    setIsSyncing(true);
    try {
      // Check for conflicts first
      console.log('🔍 [MAIN] Checking for equipment conflicts...');
      const conflicts = await checkEquipmentConflicts(date);
      console.log('🔍 [MAIN] Conflicts found:', conflicts.length);
      
      if (conflicts.length > 0) {
        console.log('⚠️ [MAIN] Equipment conflicts detected (proceeding anyway):', conflicts);
        const conflictMessages = conflicts.map(c => {
          const conflictDetails = c.conflictingEvents.map(event => 
            `${event.projectName}: ${event.eventName} (${event.quantity}x)`
          ).join(', ');
          
          return `${c.equipment}: Need ${c.needed}, only ${c.available} available (Stock: ${c.totalStock}, Used: ${c.alreadyUsed})\nConflicts: ${conflictDetails}`;
        });
        
        // Log conflicts but don't block - business rule: "never say no to a gig"
        console.warn('🎯 [MAIN] Overbooking equipment as per business policy:', conflictMessages.join('\n\n'));
        
        // Future: This is where we'd show conflict resolution dialog
        // For now: proceed with sync despite conflicts
      }

      console.log('✅ [MAIN] Proceeding with equipment sync...');
      
      // Use the proper RPC function directly
      console.log('📞 [MAIN] Calling sync_event_equipment RPC...');
      const { data, error } = await supabase.rpc('sync_event_equipment', {
        p_event_id: eventId,
        p_project_id: projectId
      });

      console.log('📞 [MAIN] RPC response:', { data, error });

      if (error) {
        console.error('❌ [MAIN] RPC error:', error);
        toast.error(`RPC Error: ${error.message}`);
        return false;
      }

      console.log('🔄 [MAIN] Invalidating queries...');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['events', projectId] }),
        queryClient.invalidateQueries({ queryKey: ['project-event-equipment', eventId] }),
        queryClient.invalidateQueries({ queryKey: ['sync-status'] })
      ]);

      console.log('✅ [MAIN] Equipment sync completed successfully');
      toast.success("Equipment synced successfully");
      return true;
    } catch (error: any) {
      console.error('❌ [MAIN] Error syncing equipment:', error);
      toast.error(error.message || "Failed to sync equipment");
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    syncEquipment,
    checkEquipmentConflicts,
    isSyncing,
    isChecking
  };
}