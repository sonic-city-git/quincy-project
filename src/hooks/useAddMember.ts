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
      console.log('Adding crew member with data:', data);
      const { role_ids, ...memberData } = data;

      // Insert the crew member
      const { data: newMember, error: memberError } = await supabase
        .from('crew_members')
        .insert([memberData])
        .select('*')
        .single();

      if (memberError) {
        console.error('Error inserting crew member:', memberError);
        throw memberError;
      }

      console.log('Successfully added crew member:', newMember);

      // If there are roles to assign and we have a valid member, create the role assignments
      if (role_ids && role_ids.length > 0 && newMember) {
        const roleAssignments = role_ids.map(role_id => ({
          crew_member_id: newMember.id,
          role_id: role_id,
        }));

        const { error: rolesError } = await supabase
          .from('crew_member_roles')
          .insert(roleAssignments);

        if (rolesError) {
          console.error('Error assigning roles:', rolesError);
          toast.error(`Warning: Failed to assign roles: ${rolesError.message}`);
        } else {
          console.log('Successfully assigned roles:', roleAssignments);
        }
      }

      return newMember;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crew'] });
    },
  });

  return mutation;
}