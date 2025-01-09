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
      console.log('Fetching crew members...');
      const { data, error } = await supabase
        .from('crew_members')
        .select('*');

      if (error) {
        console.error('Error fetching crew members:', error);
        // Check if the error is due to a blocked request
        if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
          toast({
            title: "Connection Error",
            description: "It seems like your ad blocker or browser settings might be blocking the connection. Please try disabling your ad blocker for this site.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch crew members: " + error.message,
            variant: "destructive",
          });
        }
        throw error;
      }

      console.log('Received crew data:', data);

      const typedData = data.map(member => ({
        ...member,
        roles: Array.isArray(member.roles) 
          ? (member.roles as any[]).map(role => ({
              id: role.id,
              name: role.name,
              color: role.color,
              created_at: role.created_at
            } as CrewRole)) 
          : [],
        crew_folder: member.crew_folder ? {
          id: (member.crew_folder as any).id || '',
          name: (member.crew_folder as any).name || '',
          created_at: (member.crew_folder as any).created_at || ''
        } : null
      })) as CrewMember[];

      console.log('Processed crew data:', typedData);
      setCrewMembers(typedData);
    } catch (error) {
      console.error('Error fetching crew members:', error);
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