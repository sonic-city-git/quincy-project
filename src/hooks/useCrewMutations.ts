import { useCallback } from "react";
import { CrewMember, NewCrewMember } from "@/types/crew";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";
import { Json } from "@/integrations/supabase/types";

export function useCrewMutations(fetchCrewMembers: () => Promise<void>) {
  const { toast } = useToast();

  const handleAddCrewMember = useCallback(async (newMember: NewCrewMember) => {
    try {
      console.log('Adding crew member with roles:', newMember.roles);
      
      // Convert CrewRole[] to a plain object array that matches Json type
      const rolesForJson = newMember.roles.map(role => ({
        id: role.id,
        name: role.name,
        color: role.color,
        created_at: role.created_at
      })) as Json;

      const { data: crewMember, error: crewError } = await supabase
        .from('crew_members')
        .insert({
          name: newMember.name,
          email: newMember.email,
          phone: newMember.phone,
          crew_folder: newMember.crew_folder as Json,
          roles: rolesForJson
        })
        .select()
        .single();

      if (crewError) throw crewError;

      console.log('Created crew member:', crewMember);
      
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
      console.log('Updating crew member with roles:', editedMember.roles);
      
      // Convert CrewRole[] to a plain object array that matches Json type
      const rolesForJson = editedMember.roles.map(role => ({
        id: role.id,
        name: role.name,
        color: role.color,
        created_at: role.created_at
      })) as Json;

      const { error: updateError } = await supabase
        .from('crew_members')
        .update({
          name: editedMember.name,
          email: editedMember.email,
          phone: editedMember.phone,
          crew_folder: editedMember.crew_folder as Json,
          roles: rolesForJson
        })
        .eq('id', editedMember.id);

      if (updateError) throw updateError;

      console.log('Updated crew member successfully');
      
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