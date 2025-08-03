import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook to sync crew member avatars from auth users
 * This calls a Supabase Edge Function to safely access auth.users data
 */
export function useSyncCrewAvatars() {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const syncMutation = useMutation({
    mutationFn: async () => {
      setIsLoading(true);
      
      try {
        // Call the Supabase Edge Function to sync avatars
        const { data, error } = await supabase.functions.invoke('sync-crew-avatars', {
          body: {}
        });

        if (error) {
          console.error('Error calling sync function:', error);
          throw new Error(`Sync failed: ${error.message}`);
        }

        return data;
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: (data) => {
      // Invalidate crew queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['crew'] });
      queryClient.invalidateQueries({ queryKey: ['crew-members'] });
      
      toast.success(`✅ Synced ${data?.updated || 0} crew member avatars`);
      console.log('Avatar sync completed:', data);
    },
    onError: (error) => {
      console.error('Avatar sync failed:', error);
      toast.error(`❌ Avatar sync failed: ${error.message}`);
    }
  });

  // Manual sync for specific crew member
  const syncSingleMember = async (email: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke('sync-crew-avatars', {
        body: { email }
      });

      if (error) {
        throw new Error(`Sync failed: ${error.message}`);
      }

      // Refresh queries
      queryClient.invalidateQueries({ queryKey: ['crew'] });
      queryClient.invalidateQueries({ queryKey: ['crew-members'] });
      
      toast.success(`✅ Updated avatar for ${email}`);
      return data;
      
    } catch (error) {
      console.error('Single member sync failed:', error);
      toast.error(`❌ Failed to sync avatar for ${email}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    syncAllAvatars: syncMutation.mutate,
    syncSingleMember,
    isLoading: isLoading || syncMutation.isPending,
    error: syncMutation.error
  };
}