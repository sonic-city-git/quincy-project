import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AddMemberData {
  name: string;
  email?: string;
  phone?: string;
  folder_id?: string;
  role_ids?: string[];
}

export function useAddMember() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: AddMemberData) => {
      const { role_ids, ...memberData } = data;
      
      // Insert the crew member
      const { data: newMember, error: memberError } = await supabase
        .from('crew_members')
        .insert([memberData])
        .select()
        .single();

      if (memberError) throw memberError;

      // If there are roles to assign, create the role assignments
      if (role_ids && role_ids.length > 0) {
        const roleAssignments = role_ids.map(role_id => ({
          crew_member_id: newMember.id,
          role_id: role_id,
        }));

        const { error: rolesError } = await supabase
          .from('crew_member_roles')
          .insert(roleAssignments);

        if (rolesError) throw rolesError;
      }
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