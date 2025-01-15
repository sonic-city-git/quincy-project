import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useGroupManagement(projectId: string) {
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
  const [targetGroupId, setTargetGroupId] = useState("");
  const [showNewGroupDialog, setShowNewGroupDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const queryClient = useQueryClient();

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error("Please enter a group name");
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('project_equipment_groups')
        .insert({
          project_id: projectId,
          name: newGroupName.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['project-equipment-groups'] });
      toast.success('Group created successfully');
      setShowNewGroupDialog(false);
      setNewGroupName("");
      return data;
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('Failed to create group');
      return null;
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      if (targetGroupId) {
        // Move equipment to target group
        const { error: updateError } = await supabase
          .from('project_equipment')
          .update({ group_id: targetGroupId })
          .eq('group_id', groupId);

        if (updateError) throw updateError;
      } else {
        // If no target group, remove group_id from equipment
        const { error: updateError } = await supabase
          .from('project_equipment')
          .update({ group_id: null })
          .eq('group_id', groupId);

        if (updateError) throw updateError;
      }

      // Delete the group
      const { error: deleteError } = await supabase
        .from('project_equipment_groups')
        .delete()
        .eq('id', groupId);

      if (deleteError) throw deleteError;

      await queryClient.invalidateQueries({ queryKey: ['project-equipment-groups', projectId] });
      await queryClient.invalidateQueries({ queryKey: ['project-equipment', projectId] });
      
      toast.success('Group deleted successfully');
      setGroupToDelete(null);
      setTargetGroupId("");
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
    handleDeleteGroup,
  };
}