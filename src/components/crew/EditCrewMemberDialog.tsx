import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Package } from "lucide-react";
import { useState } from "react";
import { CrewMember } from "@/types/crew";
import { useToast } from "@/hooks/use-toast";
import { EditCrewMemberForm } from "./edit/EditCrewMemberForm";

interface EditCrewMemberDialogProps {
  selectedCrew: CrewMember[];
  onEditCrewMember: (editedMember: CrewMember) => void;
  onDeleteCrewMember: () => void;
}

export function EditCrewMemberDialog({
  selectedCrew,
  onEditCrewMember,
  onDeleteCrewMember,
}: EditCrewMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { toast } = useToast();
  const crewMember = selectedCrew[0];

  if (!crewMember) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const editedMember: CrewMember = {
      id: crewMember.id,
      name: `${formData.get("firstName")} ${formData.get("lastName")}`,
      role: selectedTags.join(", "),
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      folder: formData.get("folder") as string,
    };

    onEditCrewMember(editedMember);
    setOpen(false);
  };

  const handleDelete = () => {
    onDeleteCrewMember();
    setOpen(false);
    toast({
      title: "Crew members deleted",
      description: `${selectedCrew.length} crew member(s) have been removed`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Package className="h-4 w-4" />
          EDIT
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Crew Member</DialogTitle>
        </DialogHeader>
        <EditCrewMemberForm
          crewMember={crewMember}
          selectedTags={selectedTags}
          onTagsChange={setSelectedTags}
          onSubmit={handleSubmit}
          onDelete={handleDelete}
        />
      </DialogContent>
    </Dialog>
  );
}