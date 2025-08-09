import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface UpdateProjectData {
  id: string;
  name?: string;
  customer_id?: string | null;
  crew_member_id?: string | null;
  project_type_id?: string;
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProjectData) => {
      const { id, crew_member_id, ...updateData } = data;
      
      // Map crew_member_id to owner_id (database field name)
      const projectUpdate = {
        ...updateData,
        ...(crew_member_id !== undefined && { owner_id: crew_member_id }),
      };

      const { data: project, error } = await supabase
        .from('projects')
        .update(projectUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating project:', error);
        throw error;
      }

      return project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project-details'] });
      toast.success("Project updated successfully");
    },
    onError: (error) => {
      console.error('Error updating project:', error);
      toast.error("Failed to update project");
    },
  });
}
