import { useState, useCallback } from "react";
import { CrewMember, CrewRole } from "@/types/crew";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

export function useCrewData() {
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchCrewMembers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('crew_members')
        .select('*');

      if (error) throw error;

      const typedData = data.map(member => ({
        ...member,
        roles: Array.isArray(member.roles) 
          ? (member.roles as any[]).map(role => ({
              id: role.id,
              name: role.name,
              color: role.color,
              created_at: role.created_at
            } as CrewRole)) 
          : []
      }));

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