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
import { NewCrewMember, CrewRole } from "@/types/crew";
import { AddCrewMemberForm } from "./add/AddCrewMemberForm";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AddCrewMemberDialogProps {
  onAddCrewMember: (newMember: NewCrewMember) => void;
}

export function AddCrewMemberDialog({ onAddCrewMember }: AddCrewMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  const { data: roles } = useQuery({
    queryKey: ['crew-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crew_roles')
        .select('*');
      if (error) throw error;
      return data as CrewRole[];
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const selectedRoles = roles?.filter(role => selectedRoleIds.includes(role.id)) || [];
    
    const newCrewMember: NewCrewMember = {
      name: formData.get("name") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      folder_id: formData.get("folder_id") as string,
      roles: selectedRoles,
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