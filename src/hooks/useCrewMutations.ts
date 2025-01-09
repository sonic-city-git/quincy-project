import { useCallback } from "react";
import { CrewMember, NewCrewMember } from "@/types/crew";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

export function useCrewMutations(fetchCrewMembers: () => Promise<void>) {
  const { toast } = useToast();

  const handleAddCrewMember = useCallback(async (newMember: NewCrewMember) => {
    try {
      const { data: crewMember, error: crewError } = await supabase
        .from('crew_members')
        .insert({
          name: newMember.name,
          email: newMember.email,
          phone: newMember.phone,
          crew_folder: newMember.crew_folder,
          roles: JSON.stringify(newMember.roles),
        })
        .select()
        .single();

      if (crewError) throw crewError;

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

  const handleEditCrewMember = useCallback(async (editedMember: CrewMember) => {
    try {
      const { error: updateError } = await supabase
        .from('crew_members')
        .update({
          name: editedMember.name,
          email: editedMember.email,
          phone: editedMember.phone,
          crew_folder: editedMember.crew_folder,
          roles: JSON.stringify(editedMember.roles),
        })
        .eq('id', editedMember.id);

      if (updateError) throw updateError;

      await fetchCrewMembers();
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
  }, [fetchCrewMembers, toast]);

  const handleDeleteCrewMembers = useCallback(async (selectedItems: string[]) => {
    try {
      const { error } = await supabase
        .from('crew_members')
        .delete()
        .in('id', selectedItems);

      if (error) throw error;

      await fetchCrewMembers();
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
  }, [fetchCrewMembers, toast]);

  return {
    handleAddCrewMember,
    handleEditCrewMember,
    handleDeleteCrewMembers,
  };
}