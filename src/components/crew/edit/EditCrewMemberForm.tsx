import { Button } from "@/components/ui/button";
import { CrewMember } from "@/types/crew";
import { RoleSelector } from "../shared/RoleSelector";
import { BasicInfoFields } from "../add/BasicInfoFields";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the selected crew member(s).
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button type="submit">Save Changes</Button>
      </div>
    </form>
  );
}