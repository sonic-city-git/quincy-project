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
  folders: Array<{
    id: string;
    name: string;
    created_at: string;
  }>;
}

export function EditCrewMemberForm({
  crewMember,
  selectedRoleIds,
  onRolesChange,
  onSubmit,
  onDelete,
  folders,
}: EditCrewMemberFormProps) {
  return (
    <form onSubmit={onSubmit} className="grid gap-4 py-4">
      <BasicInfoFields 
        defaultValues={{
          name: crewMember.name,
          email: crewMember.email,
          phone: crewMember.phone,
          crew_folder: crewMember.crew_folder,
        }}
        folders={folders}
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