import { useState, useCallback } from "react";
import { CrewMember } from "@/types/crew";
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

      setCrewMembers(data as CrewMember[]);
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