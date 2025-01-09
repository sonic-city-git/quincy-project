import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddMemberFormData {
  name: string;
  email: string;
  phone: string;
  role_ids: string[];
  folder_id: string;
}

export function useAddMember() {
  const queryClient = useQueryClient();

  const addMember = async (data: AddMemberFormData) => {
    try {
      const { data: crewMember, error: crewError } = await supabase
        .from('crew_members')
        .insert({
          name: data.name,
          email: data.email || null,
          phone: data.phone || null,
          folder_id: data.folder_id || null,
        })
        .select()
        .single();

      if (crewError) {
        console.error('Error inserting crew member:', crewError);
        toast.error(crewError.message || "Failed to add crew member");
        return false;
      }

      if (!crewMember) {
        toast.error("Failed to add crew member - no data returned");
        return false;
      }

      if (data.role_ids.length > 0) {
        const roleInserts = data.role_ids.map(roleId => ({
          crew_member_id: crewMember.id,
          role_id: roleId
        }));

        const { error: rolesError } = await supabase
          .from('crew_member_roles')
          .insert(roleInserts);

        if (rolesError) {
          console.error('Error inserting crew member roles:', rolesError);
          toast.error("Member added but roles could not be assigned");
          return false;
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['crew'] });
      toast.success("Crew member added successfully");
      return true;
    } catch (error) {
      console.error('Error adding crew member:', error);
      toast.error("Failed to add crew member");
      return false;
    }
  };

  return { addMember };
}