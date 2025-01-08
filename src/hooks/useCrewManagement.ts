import { useState, useEffect, useCallback } from "react";
import { CrewMember, NewCrewMember } from "@/types/crew";
import { useCrewSelection } from "./useCrewSelection";
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
  const { selectedRoles, handleRoleSelect } = useCrewRoles();

  const fetchCrewMembers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('crew_members')
        .select('*');

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
      const crewMember = {
        name: `${newMember.firstName} ${newMember.lastName}`,
        role: newMember.tags.map(tag => tag.toUpperCase()).join(", "),
        email: newMember.email,
        phone: newMember.phone,
        folder: newMember.folder,
      };

      const { data, error } = await supabase
        .from('crew_members')
        .insert([crewMember])
        .select()
        .single();

      if (error) throw error;

      setCrewMembers(prev => [...prev, data]);
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
  }, [toast]);

  const handleEditCrewMember = useCallback(async (editedMember: CrewMember) => {
    try {
      const { error } = await supabase
        .from('crew_members')
        .update(editedMember)
        .eq('id', editedMember.id);

      if (error) throw error;

      setCrewMembers(prev =>
        prev.map(member => member.id === editedMember.id ? editedMember : member)
      );
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
  }, [clearSelection, toast]);

  const handleDeleteCrewMembers = useCallback(async () => {
    try {
      const { error } = await supabase
        .from('crew_members')
        .delete()
        .in('id', selectedItems);

      if (error) throw error;

      setCrewMembers(prev => 
        prev.filter(member => !selectedItems.includes(member.id))
      );
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
  }, [selectedItems, clearSelection, toast]);

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