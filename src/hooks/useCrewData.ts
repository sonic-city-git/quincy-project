import { useState, useCallback } from "react";
import { CrewMember, NewCrewMember } from "@/types/crew";
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

  return {
    crewMembers,
    isLoading,
    fetchCrewMembers,
  };
}