import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddMemberData {
  name: string;
  email?: string;
  phone?: string;
  folder_id?: string;
}

export function useAddMember() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: AddMemberData) => {
      const { error } = await supabase
        .from('crew_members')
        .insert([data]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crew'] });
      toast.success('Crew member added successfully');
    },
    onError: (error) => {
      console.error('Error adding crew member:', error);
      toast.error('Failed to add crew member');
    }
  });

  return mutation;
}