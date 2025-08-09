/**
 * 🎯 SUBRENTAL MANAGEMENT HOOK
 * 
 * Handles marking equipment as subrented and managing external provider relationships.
 * Part of the equipment conflict resolution system.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SubrentalData {
  eventId: string;
  equipmentId: string;
  providerId?: string | null;
  cost?: number | null;
  notes?: string | null;
}

export function useSubrentalManagement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SubrentalData) => {
      // 1. Mark equipment as subrented in project_event_equipment
      const { error: updateError } = await supabase
        .from('project_event_equipment')
        .update({
          is_subrented: true,
          provider_id: data.providerId || null,
          subrental_cost: data.cost || null,
          subrental_notes: data.notes || null
        })
        .eq('event_id', data.eventId)
        .eq('equipment_id', data.equipmentId);

      if (updateError) {
        console.error('Error marking equipment as subrented:', updateError);
        throw updateError;
      }

      // 2. Return updated record
      const { data: updatedRecord, error: fetchError } = await supabase
        .from('project_event_equipment')
        .select('*, equipment(*), external_providers(*)')
        .eq('event_id', data.eventId)
        .eq('equipment_id', data.equipmentId)
        .single();

      if (fetchError) {
        console.error('Error fetching updated subrental record:', fetchError);
        throw fetchError;
      }

      return updatedRecord;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['event-equipment'] });
      queryClient.invalidateQueries({ queryKey: ['equipment-conflicts'] });
      toast.success('Equipment marked as subrented successfully');
    },
    onError: (error) => {
      console.error('Failed to mark equipment as subrented:', error);
      toast.error('Failed to mark equipment as subrented');
    }
  });
}
