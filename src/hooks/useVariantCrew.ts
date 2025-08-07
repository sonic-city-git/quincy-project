// Optimized Variant Crew Management Hook
// Focused on crew role operations with consistent patterns

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCallback } from 'react';
import {
  VariantCrewRole,
  isVariantCrewRole
} from '@/types/variants';

/**
 * Focused hook for variant crew management
 * Handles crew role CRUD operations with centralized cache management
 */
export function useVariantCrew(projectId: string, variantName: string) {
  const queryClient = useQueryClient();

  // === CACHE MANAGEMENT ===
  
  const invalidateCrewCache = useCallback(async () => {
    console.log('🔄 [useVariantCrew] Invalidating caches for:', { projectId, variantName });
    await Promise.all([
      queryClient.invalidateQueries({ 
        queryKey: ['variant-crew', projectId, variantName] 
      }),
      queryClient.invalidateQueries({ 
        queryKey: ['project-roles', projectId] 
      })
    ]);
    console.log('✅ [useVariantCrew] Cache invalidation complete');
  }, [queryClient, projectId, variantName]);

  // === DATA FETCHING ===

  const {
    data: crewRoles = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['variant-crew', projectId, variantName],
    queryFn: async (): Promise<VariantCrewRole[]> => {
      if (!projectId || !variantName) {
        return [];
      }

      // Get variant ID first
      const { data: variant, error: variantError } = await supabase
        .from('project_variants')
        .select('id')
        .eq('project_id', projectId)
        .eq('variant_name', variantName)
        .maybeSingle();

      if (variantError || !variant) {
        console.warn('[useVariantCrew] Variant not found:', { projectId, variantName });
        return [];
      }

      const { data, error } = await supabase
        .from('project_roles')
        .select(`
          *,
          role:crew_roles (
            id,
            name,
            color
          ),
          preferred_member:crew_members (
            id,
            name,
            email,
            avatar_url
          )
        `)
        .eq('project_id', projectId)
        .eq('variant_id', variant.id)
        .order('daily_rate', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch crew roles: ${error.message}`);
      }

      return (data || []).filter(isVariantCrewRole);
    },
    enabled: !!projectId && !!variantName,
    staleTime: 30 * 1000,
    cacheTime: 5 * 60 * 1000
  });

  // === CREW ROLE MUTATIONS ===

  const addCrewRoleMutation = useMutation({
    mutationFn: async (
      roleData: Omit<VariantCrewRole, 'id' | 'project_id' | 'variant_id'>
    ): Promise<VariantCrewRole> => {
      // Get variant ID
      const { data: variant, error: variantError } = await supabase
        .from('project_variants')
        .select('id')
        .eq('project_id', projectId)
        .eq('variant_name', variantName)
        .single();

      if (variantError || !variant) {
        throw new Error(`Failed to find variant: ${variantError?.message || 'Variant not found'}`);
      }

      const { data, error } = await supabase
        .from('project_roles')
        .insert({
          project_id: projectId,
          variant_id: variant.id,
          role_id: roleData.role_id,
          daily_rate: roleData.daily_rate,
          hourly_rate: roleData.hourly_rate,
          preferred_id: roleData.preferred_id,
          hourly_category: roleData.hourly_category
        })
        .select(`
          *,
          role:crew_roles (
            id,
            name,
            color
          ),
          preferred_member:crew_members (
            id,
            name,
            email,
            avatar_url
          )
        `)
        .single();

      if (error) {
        throw new Error(`Failed to add crew role: ${error.message}`);
      }

      if (!isVariantCrewRole(data)) {
        throw new Error('Invalid crew role data returned');
      }

      return data;
    },
    onSuccess: async (newRole) => {
      await invalidateCrewCache();
      toast.success(`Added ${newRole.role.name} to variant`);
    },
    onError: (error: Error) => {
      console.error('[useVariantCrew] Add crew role error:', error);
      toast.error(`Failed to add crew role: ${error.message}`);
    }
  });

  const updateCrewRoleMutation = useMutation({
    mutationFn: async ({
      roleId,
      updates
    }: {
      roleId: string;
      updates: Partial<VariantCrewRole>;
    }): Promise<VariantCrewRole> => {
      const { data, error } = await supabase
        .from('project_roles')
        .update({
          daily_rate: updates.daily_rate,
          hourly_rate: updates.hourly_rate,
          preferred_id: updates.preferred_id,
          hourly_category: updates.hourly_category
        })
        .eq('id', roleId)
        .select(`
          *,
          role:crew_roles (
            id,
            name,
            color
          ),
          preferred_member:crew_members (
            id,
            name,
            email,
            avatar_url
          )
        `)
        .single();

      if (error) {
        throw new Error(`Failed to update crew role: ${error.message}`);
      }

      if (!isVariantCrewRole(data)) {
        throw new Error('Invalid crew role data returned');
      }

      return data;
    },
    onSuccess: async (updatedRole) => {
      await invalidateCrewCache();
      toast.success(`Updated ${updatedRole.role.name} role`);
    },
    onError: (error: Error) => {
      console.error('[useVariantCrew] Update crew role error:', error);
      toast.error(`Failed to update crew role: ${error.message}`);
    }
  });

  const removeCrewRoleMutation = useMutation({
    mutationFn: async (roleId: string): Promise<void> => {
      const { error } = await supabase
        .from('project_roles')
        .delete()
        .eq('id', roleId);

      if (error) {
        throw new Error(`Failed to remove crew role: ${error.message}`);
      }
    },
    onSuccess: async () => {
      await invalidateCrewCache();
      toast.success('Crew role removed');
    },
    onError: (error: Error) => {
      console.error('[useVariantCrew] Remove crew role error:', error);
      toast.error(`Failed to remove crew role: ${error.message}`);
    }
  });

  return {
    // Data
    crewRoles,
    isLoading,
    error: error as Error | null,

    // Operations
    addCrewRole: addCrewRoleMutation.mutateAsync,
    updateCrewRole: (roleId: string, updates: Partial<VariantCrewRole>) =>
      updateCrewRoleMutation.mutateAsync({ roleId, updates }),
    removeCrewRole: removeCrewRoleMutation.mutateAsync,

    // Cache management
    invalidateCrewCache
  };
}