import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Colors selected for good readability with white text while maintaining a fresh look
const PROJECT_COLORS = [
  '#8B5CF6', // Vivid Purple
  '#0EA5E9', // Ocean Blue
  '#F97316', // Bright Orange
  '#D946EF', // Magenta Pink
];

const getRandomColor = () => {
  const randomIndex = Math.floor(Math.random() * PROJECT_COLORS.length);
  return PROJECT_COLORS[randomIndex];
};

interface AddProjectData {
  name: string;
  customer_id?: string;
  crew_member_id?: string;
  project_type: 'artist' | 'corporate' | 'broadcast' | 'dry_hire';
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
          owner_id: data.crew_member_id || null,
          color: getRandomColor(),
          project_type: data.project_type,
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