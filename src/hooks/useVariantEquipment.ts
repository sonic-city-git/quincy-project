// Optimized Variant Equipment Management Hook
// Consolidates equipment and group operations with better separation of concerns

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCallback, useState } from 'react';
import {
  VariantEquipmentGroup,
  VariantEquipmentItem,
  isVariantEquipmentItem
} from '@/types/variants';

// Enhanced types for group management
interface GroupManagementState {
  groupToDelete: string | null;
  targetGroupId: string;
  showNewGroupDialog: boolean;
  newGroupName: string;
  isLoading: boolean;
}

interface VariantEquipmentData {
  equipment_groups: VariantEquipmentGroup[];
  equipment_ungrouped: VariantEquipmentItem[];
}

/**
 * Optimized hook for variant equipment management
 * Combines equipment and group operations with centralized cache management
 */
export function useVariantEquipment(projectId: string, variantName: string) {
  const queryClient = useQueryClient();
  
  // Group management state
  const [groupState, setGroupState] = useState<GroupManagementState>({
    groupToDelete: null,
    targetGroupId: "",
    showNewGroupDialog: false,
    newGroupName: "",
    isLoading: false
  });

  // === CACHE MANAGEMENT ===
  
  const invalidateEquipmentCache = useCallback(async () => {
    console.log('🔄 [useVariantEquipment] Invalidating caches for:', { projectId, variantName });
    await Promise.all([
      queryClient.invalidateQueries({ 
        queryKey: ['variant-equipment', projectId, variantName] 
      }),
      queryClient.invalidateQueries({ 
        queryKey: ['project-equipment-groups', projectId] 
      }),
      queryClient.invalidateQueries({ 
        queryKey: ['project-equipment', projectId] 
      }),
      queryClient.invalidateQueries({
        queryKey: ['project-event-equipment', projectId]
      })
    ]);
    console.log('✅ [useVariantEquipment] Cache invalidation complete');
  }, [queryClient, projectId, variantName]);

  // === DATA FETCHING ===

  const {
    data: equipmentData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['variant-equipment', projectId, variantName],
    queryFn: async (): Promise<VariantEquipmentData> => {
      if (!projectId || !variantName) {
        return { equipment_groups: [], equipment_ungrouped: [] };
      }

      // Get variant ID first
      const { data: variant, error: variantError } = await supabase
        .from('project_variants')
        .select('id')
        .eq('project_id', projectId)
        .eq('variant_name', variantName)
        .maybeSingle();

      if (variantError || !variant) {
        console.warn('[useVariantEquipment] Variant not found:', { projectId, variantName });
        return { equipment_groups: [], equipment_ungrouped: [] };
      }

      // Fetch equipment groups and items in parallel
      const [groupsResult, itemsResult] = await Promise.all([
        supabase
          .from('project_equipment_groups')
          .select('*')
          .eq('project_id', projectId)
          .eq('variant_id', variant.id)
          .order('sort_order', { ascending: true }),
        supabase
          .from('project_equipment')
          .select(`
            *,
            equipment (
              id,
              name,
              rental_price,
              code,
              stock,
              folder_id
            )
          `)
          .eq('project_id', projectId)
          .eq('variant_id', variant.id)
          .order('equipment(name)', { ascending: true })
      ]);

      if (groupsResult.error) {
        throw new Error(`Failed to fetch equipment groups: ${groupsResult.error.message}`);
      }

      if (itemsResult.error) {
        throw new Error(`Failed to fetch equipment items: ${itemsResult.error.message}`);
      }

      // Group equipment items
      const groupedEquipment = new Map<string, VariantEquipmentItem[]>();
      const ungroupedEquipment: VariantEquipmentItem[] = [];

      (itemsResult.data || []).forEach(item => {
        if (!isVariantEquipmentItem(item)) return;
        
        if (item.group_id) {
          if (!groupedEquipment.has(item.group_id)) {
            groupedEquipment.set(item.group_id, []);
          }
          groupedEquipment.get(item.group_id)!.push(item);
        } else {
          ungroupedEquipment.push(item);
        }
      });

      // Attach equipment to groups
      const equipment_groups = (groupsResult.data || []).map(group => ({
        ...group,
        equipment_items: groupedEquipment.get(group.id) || [],
        total_price: (groupedEquipment.get(group.id) || []).reduce((total, item) => 
          total + (item.equipment.rental_price || 0) * item.quantity, 0
        )
      }));

      return { equipment_groups, equipment_ungrouped: ungroupedEquipment };
    },
    enabled: !!projectId && !!variantName,
    staleTime: 30 * 1000,
    cacheTime: 5 * 60 * 1000
  });

  // === EQUIPMENT MUTATIONS ===

  const addEquipmentItemMutation = useMutation({
    mutationFn: async (
      itemData: Omit<VariantEquipmentItem, 'id' | 'project_id' | 'variant_id'>
    ): Promise<VariantEquipmentItem> => {
      // Get variant ID
      const { data: variant, error: variantError } = await supabase
        .from('project_variants')
        .select('id')
        .eq('project_id', projectId)
        .eq('variant_name', variantName)
        .maybeSingle();

      if (variantError || !variant) {
        throw new Error(`Failed to find variant: ${variantError?.message || 'Variant not found'}`);
      }

      const { data, error } = await supabase
        .from('project_equipment')
        .insert({
          project_id: projectId,
          variant_id: variant.id,
          equipment_id: itemData.equipment_id,
          group_id: itemData.group_id,
          quantity: itemData.quantity,
          notes: itemData.notes
        })
        .select(`
          *,
          equipment (
            id,
            name,
            rental_price,
            code,
            stock,
            folder_id
          )
        `)
        .single();

      if (error) {
        throw new Error(`Failed to add equipment: ${error.message}`);
      }

      if (!isVariantEquipmentItem(data)) {
        throw new Error('Invalid equipment item data returned');
      }

      return data;
    },
    onSuccess: async (newItem) => {
      await invalidateEquipmentCache();
      toast.success(`Added ${newItem.equipment.name} to variant`);
    },
    onError: (error: Error) => {
      console.error('[useVariantEquipment] Add equipment error:', error);
      toast.error(`Failed to add equipment: ${error.message}`);
    }
  });

  const removeEquipmentItemMutation = useMutation({
    mutationFn: async (itemId: string): Promise<void> => {
      const { error } = await supabase
        .from('project_equipment')
        .delete()
        .eq('id', itemId);

      if (error) {
        throw new Error(`Failed to remove equipment: ${error.message}`);
      }
    },
    onSuccess: async () => {
      await invalidateEquipmentCache();
      toast.success('Equipment removed');
    },
    onError: (error: Error) => {
      console.error('[useVariantEquipment] Remove equipment error:', error);
      toast.error(`Failed to remove equipment: ${error.message}`);
    }
  });

  // === GROUP MUTATIONS ===

  const createGroupMutation = useMutation({
    mutationFn: async (groupData: { name: string; sort_order?: number }) => {
      const trimmedName = groupData.name.trim();
      if (!trimmedName) {
        throw new Error('Group name is required');
      }

      // Get variant ID
      const { data: variant, error: variantError } = await supabase
        .from('project_variants')
        .select('id')
        .eq('project_id', projectId)
        .eq('variant_name', variantName)
        .maybeSingle();

      if (variantError || !variant) {
        throw new Error(`Failed to find variant: ${variantError?.message || 'Variant not found'}`);
      }

      const maxSortOrder = Math.max(0, ...(equipmentData?.equipment_groups.map(g => g.sort_order) || [0]));
      const sortOrder = groupData.sort_order ?? maxSortOrder + 1;

      const { data, error } = await supabase
        .from('project_equipment_groups')
        .insert({
          project_id: projectId,
          variant_id: variant.id,
          name: trimmedName,
          sort_order: sortOrder
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create group: ${error.message}`);
      }

      return { ...data, equipment_items: [], total_price: 0 };
    },
    onSuccess: async (newGroup) => {
      await invalidateEquipmentCache();
      toast.success(`Created equipment group "${newGroup.name}"`);
      setGroupState(prev => ({ 
        ...prev, 
        showNewGroupDialog: false, 
        newGroupName: "",
        isLoading: false 
      }));
    },
    onError: (error: Error) => {
      console.error('[useVariantEquipment] Create group error:', error);
      toast.error(`Failed to create group: ${error.message}`);
      setGroupState(prev => ({ ...prev, isLoading: false }));
    }
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async ({ groupId, moveToGroupId }: { groupId: string; moveToGroupId?: string }) => {
      if (moveToGroupId) {
        // Move equipment to target group
        const [eventUpdateResult, equipmentUpdateResult] = await Promise.all([
          supabase
            .from('project_event_equipment')
            .update({ group_id: moveToGroupId })
            .eq('group_id', groupId)
            .eq('project_id', projectId),
          supabase
            .from('project_equipment')
            .update({ group_id: moveToGroupId })
            .eq('group_id', groupId)
            .eq('project_id', projectId)
        ]);

        if (eventUpdateResult.error) {
          throw new Error(`Failed to move event equipment: ${eventUpdateResult.error.message}`);
        }
        if (equipmentUpdateResult.error) {
          throw new Error(`Failed to move equipment: ${equipmentUpdateResult.error.message}`);
        }
      } else {
        // Delete equipment when no target group
        const [eventDeleteResult, equipmentDeleteResult] = await Promise.all([
          supabase
            .from('project_event_equipment')
            .delete()
            .eq('group_id', groupId)
            .eq('project_id', projectId),
          supabase
            .from('project_equipment')
            .delete()
            .eq('group_id', groupId)
            .eq('project_id', projectId)
        ]);

        if (eventDeleteResult.error) {
          throw new Error(`Failed to delete event equipment: ${eventDeleteResult.error.message}`);
        }
        if (equipmentDeleteResult.error) {
          throw new Error(`Failed to delete equipment: ${equipmentDeleteResult.error.message}`);
        }
      }

      // Delete the group
      const { error } = await supabase
        .from('project_equipment_groups')
        .delete()
        .eq('id', groupId)
        .eq('project_id', projectId);

      if (error) {
        throw new Error(`Failed to delete group: ${error.message}`);
      }

      return { moveToGroupId };
    },
    onSuccess: async ({ moveToGroupId }) => {
      await invalidateEquipmentCache();
      toast.success(moveToGroupId ? 'Equipment moved and group deleted' : 'Equipment and group deleted');
      setGroupState(prev => ({ 
        ...prev, 
        groupToDelete: null, 
        targetGroupId: "" 
      }));
    },
    onError: (error: Error) => {
      console.error('[useVariantEquipment] Delete group error:', error);
      toast.error(`Failed to delete group: ${error.message}`);
    }
  });

  // === GROUP MANAGEMENT ACTIONS ===

  const handleCreateGroup = useCallback(async () => {
    if (!groupState.newGroupName.trim()) {
      toast.error("Please enter a group name");
      return null;
    }

    setGroupState(prev => ({ ...prev, isLoading: true }));
    try {
      const result = await createGroupMutation.mutateAsync({ 
        name: groupState.newGroupName 
      });
      return result;
    } catch (error) {
      return null;
    }
  }, [groupState.newGroupName, createGroupMutation]);

  const handleDeleteGroup = useCallback(async (groupId: string) => {
    const targetGroupId = groupState.targetGroupId;
    await deleteGroupMutation.mutateAsync({ 
      groupId, 
      moveToGroupId: targetGroupId || undefined 
    });
  }, [groupState.targetGroupId, deleteGroupMutation]);

  // === STATE SETTERS ===

  const setGroupToDelete = useCallback((groupId: string | null) => {
    setGroupState(prev => ({ ...prev, groupToDelete: groupId }));
  }, []);

  const setTargetGroupId = useCallback((groupId: string) => {
    setGroupState(prev => ({ ...prev, targetGroupId: groupId }));
  }, []);

  const setShowNewGroupDialog = useCallback((show: boolean) => {
    setGroupState(prev => ({ ...prev, showNewGroupDialog: show }));
  }, []);

  const setNewGroupName = useCallback((name: string) => {
    setGroupState(prev => ({ ...prev, newGroupName: name }));
  }, []);

  return {
    // Data
    equipmentData: equipmentData || null,
    isLoading,
    error: error as Error | null,

    // Equipment operations
    addEquipmentItem: addEquipmentItemMutation.mutateAsync,
    removeEquipmentItem: removeEquipmentItemMutation.mutateAsync,

    // Group operations
    createGroup: createGroupMutation.mutateAsync,
    deleteGroup: deleteGroupMutation.mutateAsync,

    // Group management state
    groupToDelete: groupState.groupToDelete,
    targetGroupId: groupState.targetGroupId,
    showNewGroupDialog: groupState.showNewGroupDialog,
    newGroupName: groupState.newGroupName,
    isGroupLoading: groupState.isLoading,

    // Group management actions
    handleCreateGroup,
    handleDeleteGroup,
    setGroupToDelete,
    setTargetGroupId,
    setShowNewGroupDialog,
    setNewGroupName,

    // Cache management
    invalidateEquipmentCache
  };
}