import { useState, useCallback } from "react";
import { CrewMember, Role } from "@/types/crew";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

export function useCrewData() {
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchCrewMembers = useCallback(async () => {
    try {
      console.log('Fetching crew members...');
      const { data: membersData, error: membersError } = await supabase
        .from('crew_members')
        .select(`
          *,
          crew_member_roles (
            roles (
              id,
              name,
              color,
              created_at
            )
          )
        `);

      if (membersError) {
        console.error('Error fetching crew members:', membersError);
        throw membersError;
      }

      console.log('Received crew data:', membersData);

      const typedData = (membersData || []).map(member => {
        const roles = member.crew_member_roles?.map(role => ({
          id: role.roles.id,
          name: role.roles.name,
          color: role.roles.color,
          created_at: role.roles.created_at
        } as Role)) || [];

        return {
          id: member.id,
          name: member.name,
          email: member.email,
          phone: member.phone,
          folder_id: member.folder_id,
          metadata: member.metadata,
          created_at: member.created_at,
          roles: roles
        } as CrewMember;
      });

      console.log('Processed crew data:', typedData);
      setCrewMembers(typedData);
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

  return {
    crewMembers,
    isLoading,
    fetchCrewMembers,
  };
}