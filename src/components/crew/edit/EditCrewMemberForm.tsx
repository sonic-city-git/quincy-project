import { Button } from "@/components/ui/button";
import { CrewMember } from "@/types/crew";
import { DeleteCrewMemberButton } from "./DeleteCrewMemberButton";
import { RoleSelector } from "../shared/RoleSelector";
import { BasicInfoFields } from "../add/BasicInfoFields";

interface EditCrewMemberFormProps {
  crewMember: CrewMember;
  selectedRoleIds: string[];
  onRolesChange: (roleIds: string[]) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onDelete: () => void;
}

export function EditCrewMemberForm({
  crewMember,
  selectedRoleIds,
  onRolesChange,
  onSubmit,
  onDelete,
}: EditCrewMemberFormProps) {
  const [firstName, lastName] = crewMember.name.split(" ");

  return (
    <form onSubmit={onSubmit} className="grid gap-4 py-4">
      <BasicInfoFields 
        defaultValues={{
          firstName,
          lastName,
          email: crewMember.email,
          phone: crewMember.phone,
          folder: crewMember.folder,
        }}
      />
      <RoleSelector 
        selectedRoleIds={selectedRoleIds}
        onRolesChange={onRolesChange}
      />
      <div className="flex justify-between items-center">
        <Button type="submit">Save Changes</Button>
        <DeleteCrewMemberButton onDelete={onDelete} />
      </div>
    </form>
  );
}