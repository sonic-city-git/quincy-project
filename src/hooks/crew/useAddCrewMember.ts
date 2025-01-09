import { useCallback } from "react";
import { NewCrewMember } from "@/types/crew";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "../use-toast";
import { Json } from "@/integrations/supabase/types";

export function useAddCrewMember(fetchCrewMembers: () => Promise<void>) {
  const { toast } = useToast();

  return useCallback(async (newMember: NewCrewMember) => {
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
}