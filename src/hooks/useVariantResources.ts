// Variant Resources Hook
// Manages crew roles and equipment filtered by selected variant

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  VariantResourceData,
  VariantCrewRole,
  VariantEquipmentGroup,
  VariantEquipmentItem,
  VariantResourcesHook,
  isVariantCrewRole,
  isVariantEquipmentItem
} from '@/types/variants';

/**
 * Hook for managing variant-specific resources (crew and equipment)
 * Provides filtered data and CRUD operations for variant resources
 */
export function useVariantResources(
  projectId: string,
  variantName: string
): VariantResourcesHook {
  const queryClient = useQueryClient();

  // Query key factory
  const queryKey = ['variant-resources', projectId, variantName];

  // Fetch variant resources
  const {
    data: resourceData,
    isLoading,
    error
  } = useQuery({
    queryKey,
    queryFn: async (): Promise<VariantResourceData> => {
      if (!projectId || !variantName) {
        return {
          crew_roles: [],
          equipment_groups: [],
          equipment_ungrouped: []
        };
      }

      // Fetch all resources in parallel
      const [crewRolesResult, equipmentGroupsResult, equipmentItemsResult] = await Promise.all([
        fetchVariantCrewRoles(projectId, variantName),
        fetchVariantEquipmentGroups(projectId, variantName),
        fetchVariantEquipmentItems(projectId, variantName)
      ]);

      // Group equipment items by group
      const groupedEquipment = new Map<string, VariantEquipmentItem[]>();
      const ungroupedEquipment: VariantEquipmentItem[] = [];

      equipmentItemsResult.forEach(item => {
        if (item.group_id) {
          if (!groupedEquipment.has(item.group_id)) {
            groupedEquipment.set(item.group_id, []);
          }
          groupedEquipment.get(item.group_id)!.push(item);
        } else {
          ungroupedEquipment.push(item);
        }
      });

      // Attach equipment items to groups
      const equipmentGroups = equipmentGroupsResult.map(group => ({
        ...group,
        equipment_items: groupedEquipment.get(group.id) || []
      }));

      return {
        crew_roles: crewRolesResult,
        equipment_groups: equipmentGroups,
        equipment_ungrouped: ungroupedEquipment
      };
    },
    enabled: !!projectId && !!variantName,
    staleTime: 30 * 1000, // 30 seconds
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });

  // === CREW ROLE MUTATIONS ===

  const addCrewRoleMutation = useMutation({
    mutationFn: async (
      roleData: Omit<VariantCrewRole, 'id' | 'project_id' | 'variant_name'>
    ): Promise<VariantCrewRole> => {
      const { data, error } = await supabase
        .from('project_roles')
        .insert({
          project_id: projectId,
          variant_name: variantName,
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
        console.error('Error adding crew role:', error);
        throw new Error(`Failed to add crew role: ${error.message}`);
      }

      if (!isVariantCrewRole(data)) {
        throw new Error('Invalid crew role data returned from server');
      }

      return data;
    },
    onSuccess: (newRole) => {
      queryClient.invalidateQueries({ queryKey });
      toast.success(`Added ${newRole.role.name} to variant`);
    },
    onError: (error: Error) => {
      console.error('Add crew role error:', error);
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
        console.error('Error updating crew role:', error);
        throw new Error(`Failed to update crew role: ${error.message}`);
      }

      if (!isVariantCrewRole(data)) {
        throw new Error('Invalid crew role data returned from server');
      }

      return data;
    },
    onSuccess: (updatedRole) => {
      queryClient.invalidateQueries({ queryKey });
      toast.success(`Updated ${updatedRole.role.name} role`);
    },
    onError: (error: Error) => {
      console.error('Update crew role error:', error);
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
        console.error('Error removing crew role:', error);
        throw new Error(`Failed to remove crew role: ${error.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Crew role removed');
    },
    onError: (error: Error) => {
      console.error('Remove crew role error:', error);
      toast.error(`Failed to remove crew role: ${error.message}`);
    }
  });

  // === EQUIPMENT MUTATIONS ===

  const addEquipmentItemMutation = useMutation({
    mutationFn: async (
      itemData: Omit<VariantEquipmentItem, 'id' | 'project_id' | 'variant_name'>
    ): Promise<VariantEquipmentItem> => {
      const { data, error } = await supabase
        .from('project_equipment')
        .insert({
          project_id: projectId,
          variant_name: variantName,
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
        console.error('Error adding equipment item:', error);
        throw new Error(`Failed to add equipment: ${error.message}`);
      }

      if (!isVariantEquipmentItem(data)) {
        throw new Error('Invalid equipment item data returned from server');
      }

      return data;
    },
    onSuccess: (newItem) => {
      queryClient.invalidateQueries({ queryKey });
      toast.success(`Added ${newItem.equipment.name} to variant`);
    },
    onError: (error: Error) => {
      console.error('Add equipment item error:', error);
      toast.error(`Failed to add equipment: ${error.message}`);
    }
  });

  const updateEquipmentItemMutation = useMutation({
    mutationFn: async ({
      itemId,
      updates
    }: {
      itemId: string;
      updates: Partial<VariantEquipmentItem>;
    }): Promise<VariantEquipmentItem> => {
      const { data, error } = await supabase
        .from('project_equipment')
        .update({
          group_id: updates.group_id,
          quantity: updates.quantity,
          notes: updates.notes
        })
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
        console.error('Error updating equipment item:', error);
        throw new Error(`Failed to update equipment: ${error.message}`);
      }

      if (!isVariantEquipmentItem(data)) {
        throw new Error('Invalid equipment item data returned from server');
      }

      return data;
    },
    onSuccess: (updatedItem) => {
      queryClient.invalidateQueries({ queryKey });
      toast.success(`Updated ${updatedItem.equipment.name}`);
    },
    onError: (error: Error) => {
      console.error('Update equipment item error:', error);
      toast.error(`Failed to update equipment: ${error.message}`);
    }
  });

  const removeEquipmentItemMutation = useMutation({
    mutationFn: async (itemId: string): Promise<void> => {
      const { error } = await supabase
        .from('project_equipment')
        .delete()
        .eq('id', itemId);

      if (error) {
        console.error('Error removing equipment item:', error);
        throw new Error(`Failed to remove equipment: ${error.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Equipment removed');
    },
    onError: (error: Error) => {
      console.error('Remove equipment item error:', error);
      toast.error(`Failed to remove equipment: ${error.message}`);
    }
  });

  // === EQUIPMENT GROUP MUTATIONS ===

  const createEquipmentGroupMutation = useMutation({
    mutationFn: async (
      groupData: { name: string; sort_order?: number }
    ): Promise<VariantEquipmentGroup> => {
      // Calculate sort order if not provided
      const maxSortOrder = Math.max(0, ...(resourceData?.equipment_groups.map(g => g.sort_order) || [0]));
      const sortOrder = groupData.sort_order ?? maxSortOrder + 1;

      const { data, error } = await supabase
        .from('project_equipment_groups')
        .insert({
          project_id: projectId,
          variant_name: variantName,
          name: groupData.name,
          sort_order: sortOrder
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating equipment group:', error);
        throw new Error(`Failed to create equipment group: ${error.message}`);
      }

      return {
        ...data,
        equipment_items: []
      };
    },
    onSuccess: (newGroup) => {
      queryClient.invalidateQueries({ queryKey });
      toast.success(`Created equipment group "${newGroup.name}"`);
    },
    onError: (error: Error) => {
      console.error('Create equipment group error:', error);
      toast.error(`Failed to create equipment group: ${error.message}`);
    }
  });

  const updateEquipmentGroupMutation = useMutation({
    mutationFn: async ({
      groupId,
      updates
    }: {
      groupId: string;
      updates: Partial<VariantEquipmentGroup>;
    }): Promise<VariantEquipmentGroup> => {
      const { data, error } = await supabase
        .from('project_equipment_groups')
        .update({
          name: updates.name,
          sort_order: updates.sort_order
        })
        .eq('id', groupId)
        .select()
        .single();

      if (error) {
        console.error('Error updating equipment group:', error);
        throw new Error(`Failed to update equipment group: ${error.message}`);
      }

      // Get current equipment items for this group
      const currentGroup = resourceData?.equipment_groups.find(g => g.id === groupId);
      const equipmentItems = currentGroup?.equipment_items || [];

      return {
        ...data,
        equipment_items
      };
    },
    onSuccess: (updatedGroup) => {
      queryClient.invalidateQueries({ queryKey });
      toast.success(`Updated equipment group "${updatedGroup.name}"`);
    },
    onError: (error: Error) => {
      console.error('Update equipment group error:', error);
      toast.error(`Failed to update equipment group: ${error.message}`);
    }
  });

  const deleteEquipmentGroupMutation = useMutation({
    mutationFn: async ({
      groupId,
      moveItemsToGroupId
    }: {
      groupId: string;
      moveItemsToGroupId?: string;
    }): Promise<void> => {
      // First, handle equipment items in this group
      const currentGroup = resourceData?.equipment_groups.find(g => g.id === groupId);
      const equipmentItems = currentGroup?.equipment_items || [];

      if (equipmentItems.length > 0) {
        if (moveItemsToGroupId) {
          // Move items to another group
          const { error: moveError } = await supabase
            .from('project_equipment')
            .update({ group_id: moveItemsToGroupId })
            .eq('group_id', groupId);

          if (moveError) {
            console.error('Error moving equipment items:', moveError);
            throw new Error(`Failed to move equipment items: ${moveError.message}`);
          }
        } else {
          // Move items to ungrouped (null group)
          const { error: ungroupError } = await supabase
            .from('project_equipment')
            .update({ group_id: null })
            .eq('group_id', groupId);

          if (ungroupError) {
            console.error('Error ungrouping equipment items:', ungroupError);
            throw new Error(`Failed to ungroup equipment items: ${ungroupError.message}`);
          }
        }
      }

      // Delete the group
      const { error } = await supabase
        .from('project_equipment_groups')
        .delete()
        .eq('id', groupId);

      if (error) {
        console.error('Error deleting equipment group:', error);
        throw new Error(`Failed to delete equipment group: ${error.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Equipment group deleted');
    },
    onError: (error: Error) => {
      console.error('Delete equipment group error:', error);
      toast.error(`Failed to delete equipment group: ${error.message}`);
    }
  });

  return {
    // Data
    resourceData: resourceData || null,
    isLoading,
    error: error as Error | null,

    // Crew operations
    addCrewRole: addCrewRoleMutation.mutateAsync,
    updateCrewRole: (roleId: string, updates: Partial<VariantCrewRole>) =>
      updateCrewRoleMutation.mutateAsync({ roleId, updates }),
    removeCrewRole: removeCrewRoleMutation.mutateAsync,

    // Equipment operations
    addEquipmentItem: addEquipmentItemMutation.mutateAsync,
    updateEquipmentItem: (itemId: string, updates: Partial<VariantEquipmentItem>) =>
      updateEquipmentItemMutation.mutateAsync({ itemId, updates }),
    removeEquipmentItem: removeEquipmentItemMutation.mutateAsync,

    // Group operations
    createEquipmentGroup: createEquipmentGroupMutation.mutateAsync,
    updateEquipmentGroup: (groupId: string, updates: Partial<VariantEquipmentGroup>) =>
      updateEquipmentGroupMutation.mutateAsync({ groupId, updates }),
    deleteEquipmentGroup: (groupId: string, moveItemsToGroupId?: string) =>
      deleteEquipmentGroupMutation.mutateAsync({ groupId, moveItemsToGroupId })
  };
}

// === HELPER FUNCTIONS ===

async function fetchVariantCrewRoles(
  projectId: string,
  variantName: string
): Promise<VariantCrewRole[]> {
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
    .eq('variant_name', variantName)
    .order('daily_rate', { ascending: false });

  if (error) {
    console.error('Error fetching crew roles:', error);
    throw new Error(`Failed to fetch crew roles: ${error.message}`);
  }

  return (data || []).filter(isVariantCrewRole);
}

async function fetchVariantEquipmentGroups(
  projectId: string,
  variantName: string
): Promise<VariantEquipmentGroup[]> {
  const { data, error } = await supabase
    .from('project_equipment_groups')
    .select('*')
    .eq('project_id', projectId)
    .eq('variant_name', variantName)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching equipment groups:', error);
    throw new Error(`Failed to fetch equipment groups: ${error.message}`);
  }

  return (data || []).map(group => ({
    ...group,
    equipment_items: [] // Will be populated by main query
  }));
}

async function fetchVariantEquipmentItems(
  projectId: string,
  variantName: string
): Promise<VariantEquipmentItem[]> {
  const { data, error } = await supabase
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
    .eq('variant_name', variantName)
    .order('equipment(name)', { ascending: true });

  if (error) {
    console.error('Error fetching equipment items:', error);
    throw new Error(`Failed to fetch equipment items: ${error.message}`);
  }

  return (data || []).filter(isVariantEquipmentItem);
}