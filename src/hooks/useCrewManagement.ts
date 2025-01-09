import { useState, useEffect, useCallback } from "react";
import { CrewMember, NewCrewMember } from "@/types/crew";
import { useCrewSelection } from "./useCrewSelection";
import { useRoleSelection } from "./useRoleSelection";
import { useCrewRoles } from "./useCrewRoles";
import { getAllUniqueRoles, filterCrewByRoles, sortCrewMembers } from "@/utils/crewUtils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

export function useCrewManagement() {
  const [startDate, setStartDate] = useState(new Date());
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const { selectedItems, handleItemSelect, getSelectedCrew, clearSelection } = useCrewSelection();
  const { selectedRoles, handleRoleSelect } = useRoleSelection();
  const { roles } = useCrewRoles();

  const fetchCrewMembers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('crew_members')
        .select(`
          *,
          crew_member_roles (
            role_id,
            crew_roles (
              id,
              name,
              color
            )
          )
        `);

      if (error) throw error;

      setCrewMembers(data || []);
    } catch (error) {
      console.error('Error fetching crew members:', error);
      toast({
        title: "Error",
        description: "Failed to fetch crew members",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCrewMembers();
  }, [fetchCrewMembers]);

  const handleAddCrewMember = useCallback(async (newMember: NewCrewMember) => {
    try {
      // First, create the crew member
      const { data: crewMember, error: crewError } = await supabase
        .from('crew_members')
        .insert({
          name: `${newMember.firstName} ${newMember.lastName}`,
          email: newMember.email,
          phone: newMember.phone,
          folder: newMember.folder,
        })
        .select()
        .single();

      if (crewError) throw crewError;

      // Then, create the role associations
      if (newMember.roleIds.length > 0) {
        const roleAssignments = newMember.roleIds.map(roleId => ({
          crew_member_id: crewMember.id,
          role_id: roleId,
        }));

        const { error: rolesError } = await supabase
          .from('crew_member_roles')
          .insert(roleAssignments);

        if (rolesError) throw rolesError;
      }

      await fetchCrewMembers();
      toast({
        title: "Success",
        description: "Crew member added successfully",
      });
    } catch (error) {
      console.error('Error adding crew member:', error);
      toast({
        title: "Error",
        description: "Failed to add crew member",
        variant: "destructive",
      });
    }
  }, [fetchCrewMembers, toast]);

  const handleEditCrewMember = useCallback(async (editedMember: CrewMember & { roleIds: string[] }) => {
    try {
      // Update crew member basic info
      const { error: updateError } = await supabase
        .from('crew_members')
        .update({
          name: editedMember.name,
          email: editedMember.email,
          phone: editedMember.phone,
          folder: editedMember.folder,
        })
        .eq('id', editedMember.id);

      if (updateError) throw updateError;

      // Delete existing role associations
      const { error: deleteError } = await supabase
        .from('crew_member_roles')
        .delete()
        .eq('crew_member_id', editedMember.id);

      if (deleteError) throw deleteError;

      // Create new role associations
      if (editedMember.roleIds.length > 0) {
        const roleAssignments = editedMember.roleIds.map(roleId => ({
          crew_member_id: editedMember.id,
          role_id: roleId,
        }));

        const { error: rolesError } = await supabase
          .from('crew_member_roles')
          .insert(roleAssignments);

        if (rolesError) throw rolesError;
      }

      await fetchCrewMembers();
      clearSelection();
      toast({
        title: "Success",
        description: "Crew member updated successfully",
      });
    } catch (error) {
      console.error('Error updating crew member:', error);
      toast({
        title: "Error",
        description: "Failed to update crew member",
        variant: "destructive",
      });
    }
  }, [fetchCrewMembers, clearSelection, toast]);

  const handleDeleteCrewMembers = useCallback(async () => {
    try {
      const { error } = await supabase
        .from('crew_members')
        .delete()
        .in('id', selectedItems);

      if (error) throw error;

      await fetchCrewMembers();
      clearSelection();
      toast({
        title: "Success",
        description: `${selectedItems.length} crew member(s) deleted successfully`,
      });
    } catch (error) {
      console.error('Error deleting crew members:', error);
      toast({
        title: "Error",
        description: "Failed to delete crew members",
        variant: "destructive",
      });
    }
  }, [selectedItems, fetchCrewMembers, clearSelection, toast]);

  const allRoles = getAllUniqueRoles(crewMembers);
  const filteredCrewMembers = sortCrewMembers(filterCrewByRoles(crewMembers, selectedRoles));
  const selectedCrew = getSelectedCrew(filteredCrewMembers);

  return {
    selectedItems,
    startDate,
    setStartDate,
    selectedRoles,
    allRoles,
    filteredCrewMembers,
    selectedCrew,
    isLoading,
    handleItemSelect,
    handleAddCrewMember,
    handleEditCrewMember,
    handleDeleteCrewMembers,
    handleRoleSelect,
  };
}