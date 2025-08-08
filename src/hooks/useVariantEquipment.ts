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
 * 
 * ARCHITECTURAL DECISION: Uses variant_id directly for efficiency
 * - Eliminates database lookup to convert variant_name → variant_id
 * - Consistent with database foreign key relationships
 * - Aligns with RPC function signatures that expect variant_id
 */
export function useVariantEquipment(projectId: string, variantId: string) {
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
      itemData: Omit<VariantEquipmentItem, 'id' | 'project_id' | 'variant_id'> & { 
        _equipmentInfo?: { name: string; rental_price?: number | null; code?: string | null; folder_id?: string | null; } 
      }
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

      // Check if equipment already exists using the same constraint as the database
      // Constraint is on (project_id, equipment_id, group_id) NOT variant_id
      const { data: existingEquipment, error: checkError } = await supabase
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
        .eq('equipment_id', itemData.equipment_id)
        .eq('group_id', itemData.group_id)
        .maybeSingle();

      if (checkError) {
        throw new Error(`Failed to check existing equipment: ${checkError.message}`);
      }

      let data;
      let wasUpdated = false;
      
      if (existingEquipment) {
        // Equipment exists - check if it's for the correct variant
        if (existingEquipment.variant_id === variant.id) {
          // Same variant - update quantity
          const newQuantity = existingEquipment.quantity + itemData.quantity;
          const updateResult = await supabase
            .from('project_equipment')
            .update({ 
              quantity: newQuantity
            })
            .eq('id', existingEquipment.id)
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

          if (updateResult.error) {
            throw new Error(`Failed to update equipment quantity: ${updateResult.error.message}`);
          }
          data = updateResult.data;
          wasUpdated = true;
        } else {
          // Different variant - this is an orphaned record or data integrity issue
          // Update the existing record to the correct variant and add quantity
          const newQuantity = existingEquipment.quantity + itemData.quantity;
          const updateResult = await supabase
            .from('project_equipment')
            .update({ 
              variant_id: variant.id,
              quantity: newQuantity,
              notes: itemData.notes || existingEquipment.notes
            })
            .eq('id', existingEquipment.id)
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

          if (updateResult.error) {
            throw new Error(`Failed to fix orphaned equipment: ${updateResult.error.message}`);
          }
          data = updateResult.data;
          wasUpdated = true;
        }
      } else {
        // Equipment doesn't exist - insert new
        const insertResult = await supabase
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

        if (insertResult.error) {
          throw new Error(`Failed to add equipment: ${insertResult.error.message}`);
        }
        data = insertResult.data;
        wasUpdated = false;
      }

      if (!isVariantEquipmentItem(data)) {
        throw new Error('Invalid equipment item data returned');
      }

      // Add metadata about the operation
      return { 
        ...data, 
        _wasUpdated: wasUpdated, 
        _previousQuantity: existingEquipment?.quantity,
        _wasOrphaned: existingEquipment && existingEquipment.variant_id !== variant.id
      };
    },
    onMutate: async (itemData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: ['variant-equipment', projectId, variantName] 
      });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(['variant-equipment', projectId, variantName]);

      // Create temporary item for optimistic update (we don't have the real ID yet)
      const tempId = `temp-${Date.now()}`;
      const optimisticItem = {
        id: tempId,
        project_id: projectId,
        variant_id: 'temp-variant-id',
        equipment_id: itemData.equipment_id,
        group_id: itemData.group_id,
        quantity: itemData.quantity,
        notes: itemData.notes || '',
        equipment: {
          id: itemData.equipment_id,
          name: itemData._equipmentInfo?.name || 'Loading...',
          rental_price: itemData._equipmentInfo?.rental_price || null,
          code: itemData._equipmentInfo?.code || null,
          stock: null,
          folder_id: itemData._equipmentInfo?.folder_id || null
        }
      } as VariantEquipmentItem;

      // Optimistically update the cache
      queryClient.setQueryData(['variant-equipment', projectId, variantName], (old: VariantEquipmentData | undefined) => {
        if (!old) return old;

        if (itemData.group_id) {
          // Add to specific group
          const updatedGroups = old.equipment_groups.map(group => {
            if (group.id === itemData.group_id) {
              // Check if equipment already exists in this group
              const existingItemIndex = group.equipment_items.findIndex(
                item => item.equipment_id === itemData.equipment_id
              );

              if (existingItemIndex >= 0) {
                // Update existing item quantity
                const updatedItems = [...group.equipment_items];
                updatedItems[existingItemIndex] = {
                  ...updatedItems[existingItemIndex],
                  quantity: updatedItems[existingItemIndex].quantity + itemData.quantity
                };
                return {
                  ...group,
                  equipment_items: updatedItems
                };
              } else {
                // Add new item
                return {
                  ...group,
                  equipment_items: [...group.equipment_items, optimisticItem]
                };
              }
            }
            return group;
          });

          return {
            equipment_groups: updatedGroups,
            equipment_ungrouped: old.equipment_ungrouped
          };
        } else {
          // Add to ungrouped - also check for duplicates here
          const existingItemIndex = old.equipment_ungrouped.findIndex(
            item => item.equipment_id === itemData.equipment_id
          );

          if (existingItemIndex >= 0) {
            // Update existing item quantity
            const updatedUngrouped = [...old.equipment_ungrouped];
            updatedUngrouped[existingItemIndex] = {
              ...updatedUngrouped[existingItemIndex],
              quantity: updatedUngrouped[existingItemIndex].quantity + itemData.quantity
            };
            return {
              equipment_groups: old.equipment_groups,
              equipment_ungrouped: updatedUngrouped
            };
          } else {
            // Add new item
            return {
              equipment_groups: old.equipment_groups,
              equipment_ungrouped: [...old.equipment_ungrouped, optimisticItem]
            };
          }
        }
      });

      return { previousData };
    },
    onSuccess: async (newItem, variables) => {
      // Refetch to get the real data
      await invalidateEquipmentCache();
      // Success message handled by caller for more specific messaging
    },
    onError: (error: Error, newData, context) => {
      // Roll back optimistic update
      queryClient.setQueryData(['variant-equipment', projectId, variantName], context?.previousData);
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

  const updateEquipmentItemMutation = useMutation({
    mutationFn: async ({
      itemId,
      quantity,
      notes
    }: {
      itemId: string;
      quantity?: number;
      notes?: string;
    }): Promise<VariantEquipmentItem> => {
      const updateData: any = {};
      if (quantity !== undefined) updateData.quantity = quantity;
      if (notes !== undefined) updateData.notes = notes;

      const { data, error } = await supabase
        .from('project_equipment')
        .update(updateData)
        .eq('id', itemId)
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
        throw new Error(`Failed to update equipment: ${error.message}`);
      }

      if (!isVariantEquipmentItem(data)) {
        throw new Error('Invalid equipment item data returned');
      }

      return data;
    },
    onMutate: async ({ itemId, quantity, notes }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: ['variant-equipment', projectId, variantName] 
      });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(['variant-equipment', projectId, variantName]);

      // Optimistically update the cache
      queryClient.setQueryData(['variant-equipment', projectId, variantName], (old: VariantEquipmentData | undefined) => {
        if (!old) return old;

        const updatedGroups = old.equipment_groups.map(group => ({
          ...group,
          equipment_items: group.equipment_items.map(item => {
            if (item.id === itemId) {
              return {
                ...item,
                quantity: quantity !== undefined ? quantity : item.quantity,
                notes: notes !== undefined ? notes : item.notes
              };
            }
            return item;
          })
        }));

        const updatedUngrouped = old.equipment_ungrouped.map(item => {
          if (item.id === itemId) {
            return {
              ...item,
              quantity: quantity !== undefined ? quantity : item.quantity,
              notes: notes !== undefined ? notes : item.notes
            };
          }
          return item;
        });

        return {
          equipment_groups: updatedGroups,
          equipment_ungrouped: updatedUngrouped
        };
      });

      // Return a context object with the snapshotted value
      return { previousData };
    },
    onError: (error: Error, newData, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(['variant-equipment', projectId, variantName], context?.previousData);
      console.error('[useVariantEquipment] Update equipment error:', error);
      toast.error(`Failed to update equipment: ${error.message}`);
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ 
        queryKey: ['variant-equipment', projectId, variantName] 
      });
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
    updateEquipmentItem: updateEquipmentItemMutation.mutateAsync,

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