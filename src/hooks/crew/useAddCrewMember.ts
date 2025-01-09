import { useCallback } from "react";
import { NewCrewMember } from "@/types/crew";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "../use-toast";
import { Json } from "@/integrations/supabase/types";

export function useAddCrewMember(fetchCrewMembers: () => Promise<void>) {
  const { toast } = useToast();

  return useCallback(async (newMember: NewCrewMember) => {
    try {
      const rolesForJson = newMember.roles.map(role => ({
        id: role.id,
        name: role.name,
        color: role.color,
        created_at: role.created_at
      })) as Json;

      const crewFolderJson = newMember.crew_folder ? {
        id: newMember.crew_folder.id,
        name: newMember.crew_folder.name,
        created_at: newMember.crew_folder.created_at
      } as Json : null;

      const { data: crewMember, error: crewError } = await supabase
        .from('crew_members')
        .insert({
          name: newMember.name,
          email: newMember.email,
          phone: newMember.phone,
          crew_folder: crewFolderJson,
          roles: rolesForJson
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
}