import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { NewCrewMember } from "@/types/crew";
import { AddCrewMemberForm } from "./add/AddCrewMemberForm";

interface AddCrewMemberDialogProps {
  onAddCrewMember: (newMember: NewCrewMember) => void;
}

export function AddCrewMemberDialog({ onAddCrewMember }: AddCrewMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newCrewMember: NewCrewMember = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      folder: formData.get("folder") as string,
      roleIds: selectedRoleIds,
    };

    onAddCrewMember(newCrewMember);
    setOpen(false);
    setSelectedRoleIds([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add crew member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Crew Member</DialogTitle>
        </DialogHeader>
        <AddCrewMemberForm 
          selectedRoleIds={selectedRoleIds}
          onRolesChange={setSelectedRoleIds}
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}