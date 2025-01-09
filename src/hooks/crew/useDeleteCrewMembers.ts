import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "../use-toast";

export function useDeleteCrewMembers(fetchCrewMembers: () => Promise<void>) {
  const { toast } = useToast();

  return useCallback(async (selectedItems: string[]) => {
    try {
      // First check if any of the selected crew members are project owners
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('owner_id')
        .in('owner_id', selectedItems);

      if (projectsError) throw projectsError;

      if (projects && projects.length > 0) {
        toast({
          title: "Cannot Delete",
          description: "One or more selected crew members are project owners. Please reassign their projects before deleting.",
          variant: "destructive",
        });
        return;
      }

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
}