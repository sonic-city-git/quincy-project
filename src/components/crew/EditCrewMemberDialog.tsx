import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Wrench } from "lucide-react";
import { useState, useEffect } from "react";
import { CrewMember } from "@/types/crew";
import { useToast } from "@/hooks/use-toast";
import { EditCrewMemberForm } from "./edit/EditCrewMemberForm";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface EditCrewMemberDialogProps {
  selectedCrew: CrewMember[];
  onEditCrewMember: (editedMember: CrewMember & { roleIds: string[] }) => void;
  onDeleteCrewMember: () => void;
}

export function EditCrewMemberDialog({
  selectedCrew,
  onEditCrewMember,
  onDeleteCrewMember,
}: EditCrewMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const crewMember = selectedCrew[0];

  if (!crewMember) return null;

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

  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  useEffect(() => {
    if (memberRoles) {
      setSelectedRoleIds(memberRoles.map(role => role.role_id));
    }
  }, [memberRoles]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const editedMember = {
      ...crewMember,
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      folder_id: formData.get("folder_id") as string,
      roleIds: selectedRoleIds,
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
          <Wrench className="h-4 w-4" />
          EDIT
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Crew Member</DialogTitle>
        </DialogHeader>
        <EditCrewMemberForm
          crewMember={crewMember}
          selectedRoleIds={selectedRoleIds}
          onRolesChange={setSelectedRoleIds}
          onSubmit={handleSubmit}
          onDelete={handleDelete}
        />
      </DialogContent>
    </Dialog>
  );
}