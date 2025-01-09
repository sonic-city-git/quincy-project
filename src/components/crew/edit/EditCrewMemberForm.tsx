import { Button } from "@/components/ui/button";
import { CrewMember } from "@/types/crew";
import { DeleteCrewMemberButton } from "./DeleteCrewMemberButton";
import { RoleSelector } from "../shared/RoleSelector";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BasicInfoFields } from "../add/BasicInfoFields";

interface EditCrewMemberFormProps {
  crewMember: CrewMember;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onDelete: () => void;
}

export function EditCrewMemberForm({
  crewMember,
  onSubmit,
  onDelete,
}: EditCrewMemberFormProps) {
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  // Fetch existing roles for this crew member
  const { data: memberRoles } = useQuery({
    queryKey: ['crew-member-roles', crewMember.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crew_member_roles')
        .select('role_id')
        .eq('crew_member_id', crewMember.id);
      
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (memberRoles) {
      setSelectedRoleIds(memberRoles.map(role => role.role_id));
    }
  }, [memberRoles]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const editedMember: CrewMember = {
      id: crewMember.id,
      name: `${formData.get("firstName")} ${formData.get("lastName")}`,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      folder: formData.get("folder") as string,
    };

    onSubmit(e);
  };

  const [firstName, lastName] = crewMember.name.split(" ");

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <BasicInfoFields 
          defaultValues={{
            firstName,
            lastName,
            email: crewMember.email,
            phone: crewMember.phone,
            folder: crewMember.folder,
          }}
        />
      </div>
      <RoleSelector 
        selectedRoleIds={selectedRoleIds}
        onRolesChange={setSelectedRoleIds}
      />
      <div className="flex justify-between items-center">
        <Button type="submit">Save Changes</Button>
        <DeleteCrewMemberButton onDelete={onDelete} />
      </div>
    </form>
  );
}