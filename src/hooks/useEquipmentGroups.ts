import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useEquipmentGroups(projectId: string) {
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
  const [targetGroupId, setTargetGroupId] = useState<string>("");
  const [showNewGroupDialog, setShowNewGroupDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const queryClient = useQueryClient();

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    try {
      const { data: newGroup, error } = await supabase
        .from('project_equipment_groups')
        .insert({
          project_id: projectId,
          name: newGroupName.trim(),
          sort_order: 0 // Will be updated by trigger
        })
        .select()
        .single();

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['project-equipment-groups', projectId] });
      setShowNewGroupDialog(false);
      setNewGroupName("");
      toast.success('Group created successfully');
      
      return newGroup;
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('Failed to create group');
      return null;
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      // First, check if the group has any equipment
      const { data: equipment, error: equipmentError } = await supabase
        .from('project_equipment')
        .select('id')
        .eq('group_id', groupId);

      if (equipmentError) throw equipmentError;

      // If the group has equipment and no target group is selected, show error
      if (equipment && equipment.length > 0 && !targetGroupId) {
        toast.error('Please select a target group for the equipment');
        return;
      }

      // If there's equipment and a target group, move the equipment first
      if (equipment && equipment.length > 0 && targetGroupId) {
        const { error: moveError } = await supabase
          .from('project_equipment')
          .update({ group_id: targetGroupId })
          .eq('group_id', groupId);

        if (moveError) throw moveError;
      }

      // Now delete the group
      const { error: deleteError } = await supabase
        .from('project_equipment_groups')
        .delete()
        .eq('id', groupId);

      if (deleteError) throw deleteError;

      await queryClient.invalidateQueries({ queryKey: ['project-equipment-groups', projectId] });
      toast.success('Group deleted successfully');
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Failed to delete group');
    }
  };

  return {
    groupToDelete,
    setGroupToDelete,
    targetGroupId,
    setTargetGroupId,
    showNewGroupDialog,
    setShowNewGroupDialog,
    newGroupName,
    setNewGroupName,
    handleCreateGroup,
    handleDeleteGroup
  };
}