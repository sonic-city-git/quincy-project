import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface AddProjectData {
  name: string;
  customer_id?: string;
  crew_member_id?: string;
}

export function useAddProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AddProjectData) => {
      console.log('Adding project with data:', data);
      
      const { data: project, error } = await supabase
        .from('projects')
        .insert([{
          name: data.name,
          customer_id: data.customer_id || null,
          owner_id: data.crew_member_id || null, // Map crew_member_id to owner_id
          status: 'draft'
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding project:', error);
        throw error;
      }

      return project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success("Project added successfully");
    },
    onError: (error) => {
      console.error('Error adding project:', error);
      toast.error("Failed to add project");
    },
  });
}