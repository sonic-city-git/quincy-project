import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface AddProjectData {
  name: string;
  customer_id?: string;
  crew_member_id?: string;
}

export function useAddProject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: AddProjectData) => {
      const { data: project, error } = await supabase
        .from('projects')
        .insert([data])
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
      toast({
        title: "Success",
        description: "Project added successfully",
      });
    },
    onError: (error) => {
      console.error('Error adding project:', error);
      toast({
        title: "Error",
        description: "Failed to add project",
        variant: "destructive",
      });
    },
  });
}