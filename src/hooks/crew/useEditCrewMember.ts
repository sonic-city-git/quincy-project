import { useCallback } from "react";
import { CrewMember } from "@/types/crew";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "../use-toast";
import { Json } from "@/integrations/supabase/types";

export function useEditCrewMember(fetchCrewMembers: () => Promise<void>) {
  const { toast } = useToast();

  return useCallback(async (editedMember: CrewMember) => {
    try {
      const rolesForJson = editedMember.roles.map(role => ({
        id: role.id,
        name: role.name,
        color: role.color,
        created_at: role.created_at
      })) as Json;

      const crewFolderJson = editedMember.crew_folder ? {
        id: editedMember.crew_folder.id,
        name: editedMember.crew_folder.name,
        created_at: editedMember.crew_folder.created_at
      } as Json : null;

      const { error: updateError } = await supabase
        .from('crew_members')
        .update({
          name: editedMember.name,
          email: editedMember.email,
          phone: editedMember.phone,
          crew_folder: crewFolderJson,
          roles: rolesForJson
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
}