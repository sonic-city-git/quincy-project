// Project Variants Management Hook
// Handles CRUD operations for project variants (Trio, Band, DJ configurations)

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  ProjectVariant,
  CreateVariantPayload,
  UpdateVariantPayload,
  VariantManagementHook,
  VARIANT_CONSTANTS,
  validateVariantName,
  isProjectVariant
} from '@/types/variants';

/**
 * Hook for managing project variants
 * Provides CRUD operations and state management for artist project configurations
 */
export function useProjectVariants(projectId: string): VariantManagementHook {
  const queryClient = useQueryClient();
  const [selectedVariant, setSelectedVariant] = useState<string>('');

  // Query key factory
  const queryKey = ['project-variants', projectId];

  // Fetch project variants
  const {
    data: variants = [],
    isLoading,
    error
  } = useQuery({
    queryKey,
    queryFn: async (): Promise<ProjectVariant[]> => {
      if (!projectId) {
        return [];
      }

      const { data, error } = await supabase
        .from('project_variants')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching project variants:', error);
        throw new Error(`Failed to fetch variants: ${error.message}`);
      }

      // Validate data and filter out invalid entries
      const validVariants = (data || []).filter(isProjectVariant);
      
      if (validVariants.length !== (data || []).length) {
        console.warn('Some variant data was invalid and filtered out');
      }

      return validVariants;
    },
    enabled: !!projectId,
    staleTime: 30 * 1000, // 30 seconds
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });

  // Auto-select the default variant when variants are loaded
  useEffect(() => {
    if (variants.length > 0) {
      // Check if current selectedVariant exists in the variants list
      const currentVariantExists = selectedVariant && variants.some(v => v.variant_name === selectedVariant);
      
      if (!currentVariantExists) {
        // Select the default variant first, or fall back to the first variant
        const defaultVariant = variants.find(v => v.is_default === true) || variants[0];
        setSelectedVariant(defaultVariant.variant_name);
      }
    } else {
      // No variants exist - clear selected variant
      setSelectedVariant('');
    }
  }, [variants, selectedVariant]);

  // Create variant mutation
  const createVariantMutation = useMutation({
    mutationFn: async (data: CreateVariantPayload): Promise<ProjectVariant> => {
      // Trim the variant name
      const trimmedName = data.variant_name.trim();
      
      // Validate input
      if (!validateVariantName(trimmedName)) {
        throw new Error('Invalid variant name. Please use letters, numbers, spaces, hyphens, or underscores only.');
      }

      // Check for duplicate names
      const existingVariant = variants.find(v => v.variant_name.toLowerCase() === trimmedName.toLowerCase());
      if (existingVariant) {
        throw new Error(`Variant "${trimmedName}" already exists.`);
      }

      // Calculate sort order if not provided
      const sortOrder = data.sort_order ?? Math.max(0, ...variants.map(v => v.sort_order || 0)) + 1;

      // First variant logic - no special handling needed since we use creation order

      const { data: newVariant, error } = await supabase
        .from('project_variants')
        .insert({
          project_id: projectId,
          variant_name: trimmedName,
          description: data.description,
          sort_order: sortOrder
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating variant:', error);
        throw new Error(`Failed to create variant: ${error.message}`);
      }

      if (!isProjectVariant(newVariant)) {
        throw new Error('Invalid variant data returned from server');
      }

      return newVariant;
    },
    onSuccess: (newVariant) => {
      // Invalidate and refetch variants
      queryClient.invalidateQueries({ queryKey });
      
      // Select the new variant
      setSelectedVariant(newVariant.variant_name);
      
      toast.success(`Variant "${newVariant.variant_name}" created successfully`);
    },
    onError: (error: Error) => {
      console.error('Create variant error:', error);
      toast.error(`Failed to create variant: ${error.message}`);
    }
  });

  // Update variant mutation
  const updateVariantMutation = useMutation({
    mutationFn: async (data: UpdateVariantPayload): Promise<ProjectVariant> => {
      const variant = variants.find(v => v.id === data.id);
      if (!variant) {
        throw new Error('Variant not found');
      }

      const { data: updatedVariant, error } = await supabase
        .from('project_variants')
        .update({
          variant_name: data.variant_name,
          description: data.description,
          sort_order: data.sort_order
        })
        .eq('id', data.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating variant:', error);
        throw new Error(`Failed to update variant: ${error.message}`);
      }

      if (!isProjectVariant(updatedVariant)) {
        throw new Error('Invalid variant data returned from server');
      }

      return updatedVariant;
    },
    onSuccess: (updatedVariant) => {
      queryClient.invalidateQueries({ queryKey });
      toast.success(`Variant "${updatedVariant.variant_name}" updated successfully`);
    },
    onError: (error: Error) => {
      console.error('Update variant error:', error);
      toast.error(`Failed to update variant: ${error.message}`);
    }
  });

  // Delete variant mutation
  const deleteVariantMutation = useMutation({
    mutationFn: async (variantName: string): Promise<void> => {
      const variant = variants.find(v => v.variant_name === variantName);
      if (!variant) {
        throw new Error('Variant not found');
      }

      // Prevent deletion if it's the only variant
      if (variants.length === 1) {
        throw new Error('Cannot delete the only variant. Create another variant first.');
      }

      // Check if variant has associated crew roles or equipment
      const [crewRolesResult, equipmentResult] = await Promise.all([
        supabase
          .from('project_roles')
          .select('id')
          .eq('project_id', projectId)
          .eq('variant_id', variant.id)
          .limit(1),
        supabase
          .from('project_equipment')
          .select('id')
          .eq('project_id', projectId)
          .eq('variant_id', variant.id)
          .limit(1)
      ]);

      const hasResources = (crewRolesResult.data?.length ?? 0) > 0 || (equipmentResult.data?.length ?? 0) > 0;
      
      if (hasResources) {
        throw new Error(`Cannot delete variant "${variant.variant_name}" because it has associated crew roles or equipment. Remove all resources first.`);
      }

      // Delete the variant
      const { error } = await supabase
        .from('project_variants')
        .delete()
        .eq('id', variant.id);

      if (error) {
        console.error('Error deleting variant:', error);
        throw new Error(`Failed to delete variant: ${error.message}`);
      }
    },
    onSuccess: (_, variantName) => {
      queryClient.invalidateQueries({ queryKey });
      
      // Switch to another variant if we deleted the selected one
      if (selectedVariant === variantName) {
        const remainingVariants = variants.filter(v => v.variant_name !== variantName);
        if (remainingVariants.length > 0) {
          // Select the default variant first, or fall back to the first remaining variant
          const defaultVariant = remainingVariants.find(v => v.is_default === true) || remainingVariants[0];
          setSelectedVariant(defaultVariant.variant_name);
        } else {
          // No variants left
          setSelectedVariant('');
        }
      }
      
      toast.success('Variant deleted successfully');
    },
    onError: (error: Error) => {
      console.error('Delete variant error:', error);
      toast.error(`Failed to delete variant: ${error.message}`);
    }
  });

  // Duplicate variant mutation
  const duplicateVariantMutation = useMutation({
    mutationFn: async ({ 
      sourceVariant, 
      newVariantData 
    }: { 
      sourceVariant: string; 
      newVariantData: CreateVariantPayload 
    }): Promise<ProjectVariant> => {
      const source = variants.find(v => v.variant_name === sourceVariant);
      if (!source) {
        throw new Error('Source variant not found');
      }

      // Create the new variant first
      const newVariant = await createVariantMutation.mutateAsync(newVariantData);

      // Copy crew roles using variant_id
      const { data: crewRoles } = await supabase
        .from('project_roles')
        .select('*')
        .eq('project_id', projectId)
        .eq('variant_id', source.id);

      if (crewRoles && crewRoles.length > 0) {
        const newCrewRoles = crewRoles.map(role => ({
          project_id: projectId,
          variant_id: newVariant.id,
          role_id: role.role_id,
          daily_rate: role.daily_rate,
          hourly_rate: role.hourly_rate,
          preferred_id: role.preferred_id,
          hourly_category: role.hourly_category
        }));

        const { error: crewError } = await supabase
          .from('project_roles')
          .insert(newCrewRoles);

        if (crewError) {
          console.error('Error copying crew roles:', crewError);
          // Don't throw here, just log the error
        }
      }

      // Copy equipment groups and items using variant_id
      const { data: equipmentGroups } = await supabase
        .from('project_equipment_groups')
        .select('*')
        .eq('project_id', projectId)
        .eq('variant_id', source.id);

      if (equipmentGroups && equipmentGroups.length > 0) {
        for (const group of equipmentGroups) {
          // Create new group
          const { data: newGroup, error: groupError } = await supabase
            .from('project_equipment_groups')
            .insert({
              project_id: projectId,
              variant_id: newVariant.id,
              name: group.name,
              sort_order: group.sort_order
            })
            .select()
            .single();

          if (groupError) {
            console.error('Error copying equipment group:', groupError);
            continue;
          }

          // Copy equipment items for this group using variant_id
          const { data: equipmentItems } = await supabase
            .from('project_equipment')
            .select('*')
            .eq('project_id', projectId)
            .eq('variant_id', source.id)
            .eq('group_id', group.id);

          if (equipmentItems && equipmentItems.length > 0) {
            const newEquipmentItems = equipmentItems.map(item => ({
              project_id: projectId,
              variant_id: newVariant.id,
              equipment_id: item.equipment_id,
              group_id: newGroup.id,
              quantity: item.quantity,
              notes: item.notes
            }));

            const { error: equipmentError } = await supabase
              .from('project_equipment')
              .insert(newEquipmentItems);

            if (equipmentError) {
              console.error('Error copying equipment items:', equipmentError);
            }
          }
        }
      }

      return newVariant;
    },
    onSuccess: (newVariant) => {
      queryClient.invalidateQueries({ queryKey });
      // Also invalidate resource queries since we copied resources
      queryClient.invalidateQueries(['variant-resources', projectId]);
      setSelectedVariant(newVariant.variant_name);
      toast.success(`Variant "${newVariant.variant_name}" duplicated successfully`);
    },
    onError: (error: Error) => {
      console.error('Duplicate variant error:', error);
      toast.error(`Failed to duplicate variant: ${error.message}`);
    }
  });

  // Reorder variants mutation
  const reorderVariantsMutation = useMutation({
    mutationFn: async ({ variantIds, newOrder }: { variantIds: string[]; newOrder: number[] }): Promise<void> => {
      if (variantIds.length !== newOrder.length) {
        throw new Error('Variant IDs and order array lengths must match');
      }

      // Update sort orders
      const updates = variantIds.map((id, index) => ({
        id,
        sort_order: newOrder[index]
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('project_variants')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);

        if (error) {
          console.error('Error updating variant order:', error);
          throw new Error(`Failed to reorder variants: ${error.message}`);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Variant order updated successfully');
    },
    onError: (error: Error) => {
      console.error('Reorder variants error:', error);
      toast.error(`Failed to reorder variants: ${error.message}`);
    }
  });

  // Utility functions
  const getVariantByName = useCallback((variantName: string): ProjectVariant | undefined => {
    return variants.find(v => v.variant_name === variantName);
  }, [variants]);

  const getDefaultVariant = useCallback((): ProjectVariant | undefined => {
    // Find the variant marked as default, or fall back to the first one
    return variants.find(v => v.is_default === true) || variants[0];
  }, [variants]);

  const selectedVariantObject = useMemo((): ProjectVariant | undefined => {
    return selectedVariant ? variants.find(v => v.variant_name === selectedVariant) : undefined;
  }, [variants, selectedVariant]);

  return {
    // Data
    variants,
    selectedVariant,
    selectedVariantObject,
    isLoading,
    error: error as Error | null,

    // Actions
    setSelectedVariant,
    createVariant: createVariantMutation.mutateAsync,
    updateVariant: updateVariantMutation.mutateAsync,
    deleteVariant: deleteVariantMutation.mutateAsync,
    duplicateVariant: (sourceVariant: string, newVariantData: CreateVariantPayload) =>
      duplicateVariantMutation.mutateAsync({ sourceVariant, newVariantData }),
    reorderVariants: (variantIds: string[], newOrder: number[]) =>
      reorderVariantsMutation.mutateAsync({ variantIds, newOrder }),

    // Utilities
    getVariantByName,
    getDefaultVariant
  };
}

// Variant name generation is no longer needed - users enter variant names directly