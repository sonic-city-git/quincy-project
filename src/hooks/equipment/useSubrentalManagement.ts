/**
 * 🎯 SUBRENTAL MANAGEMENT HOOK
 * 
 * Handles CRUD operations for confirmed subrentals.
 * Manages the transition from suggestions to confirmed bookings.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ConfirmedSubrental } from '@/types/equipment';

interface CreateSubrentalData {
  equipment_id: string;
  equipment_name: string;
  provider_id: string;
  start_date: string;
  end_date: string;
  quantity: number;
  cost?: number;
  notes?: string;
}

interface UpdateSubrentalData extends Partial<CreateSubrentalData> {
  id: string;
  status?: 'confirmed' | 'delivered' | 'returned' | 'cancelled';
}

export function useSubrentalManagement() {
  const queryClient = useQueryClient();

  // Create confirmed subrental
  const createSubrental = useMutation({
    mutationFn: async (data: CreateSubrentalData): Promise<ConfirmedSubrental> => {
      // Generate temporary serial number
      const { data: providerData } = await supabase
        .from('external_providers')
        .select('company_name')
        .eq('id', data.provider_id)
        .single();

      const providerName = providerData?.company_name || 'Unknown Provider';
      const temporarySerial = `${providerName} ${data.equipment_name} #1`;

      const { data: subrental, error } = await supabase
        .from('confirmed_subrentals')
        .insert({
          equipment_id: data.equipment_id,
          equipment_name: data.equipment_name,
          provider_id: data.provider_id,
          start_date: data.start_date,
          end_date: data.end_date,
          quantity: data.quantity,
          cost: data.cost || null,
          notes: data.notes || null,
          temporary_serial: temporarySerial,
          status: 'confirmed'
        })
        .select(`
          *,
          external_providers!inner(company_name)
        `)
        .single();

      if (error) {
        console.error('Error creating confirmed subrental:', error);
        throw error;
      }

      return subrental;
    },
    onSuccess: () => {
      // Invalidate queries to refresh the timeline
      queryClient.invalidateQueries({ queryKey: ['confirmed-subrentals'] });
      queryClient.invalidateQueries({ queryKey: ['equipment-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['equipment-data'] });
    },
    onError: (error) => {
      console.error('Failed to create subrental:', error);
    }
  });

  // Update confirmed subrental
  const updateSubrental = useMutation({
    mutationFn: async (data: UpdateSubrentalData): Promise<ConfirmedSubrental> => {
      const { id, ...updateData } = data;
      
      const { data: subrental, error } = await supabase
        .from('confirmed_subrentals')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          external_providers!inner(company_name)
        `)
        .single();

      if (error) {
        console.error('Error updating confirmed subrental:', error);
        throw error;
      }

      return subrental;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['confirmed-subrentals'] });
      queryClient.invalidateQueries({ queryKey: ['equipment-bookings'] });
    },
    onError: (error) => {
      console.error('Failed to update subrental:', error);
    }
  });

  // Delete confirmed subrental
  const deleteSubrental = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('confirmed_subrentals')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting confirmed subrental:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['confirmed-subrentals'] });
      queryClient.invalidateQueries({ queryKey: ['equipment-bookings'] });
    },
    onError: (error) => {
      console.error('Failed to delete subrental:', error);
    }
  });

  // Cancel confirmed subrental (soft delete by status)
  const cancelSubrental = useMutation({
    mutationFn: async (id: string): Promise<ConfirmedSubrental> => {
      return updateSubrental.mutateAsync({ id, status: 'cancelled' });
    }
  });

  return {
    createSubrental,
    updateSubrental,
    deleteSubrental,
    cancelSubrental,
    
    // Loading states
    isCreating: createSubrental.isPending,
    isUpdating: updateSubrental.isPending,
    isDeleting: deleteSubrental.isPending,
    isCancelling: cancelSubrental.isPending,
    
    // Error states
    createError: createSubrental.error,
    updateError: updateSubrental.error,
    deleteError: deleteSubrental.error,
    cancelError: cancelSubrental.error
  };
}