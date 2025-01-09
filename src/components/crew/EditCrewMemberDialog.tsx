import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  onEditCrewMember: (editedMember: CrewMember) => void;
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

  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(
    crewMember.roles?.map(role => role.id) || []
  );

  const { data: allRoles } = useQuery({
    queryKey: ['crew-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crew_roles')
        .select('*');
      if (error) throw error;
      return data;
    },
  });

  const { data: folders } = useQuery({
    queryKey: ['crew-folders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crew_folders')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    setSelectedRoleIds(crewMember.roles?.map(role => role.id) || []);
  }, [crewMember]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const updatedRoles = allRoles?.filter(role => selectedRoleIds.includes(role.id)) || [];
    const crewFolderStr = formData.get("crew_folder") as string;
    let crewFolder = null;
    
    try {
      if (crewFolderStr) {
        const parsedFolder = JSON.parse(crewFolderStr);
        crewFolder = {
          id: parsedFolder.id,
          name: parsedFolder.name,
          created_at: parsedFolder.created_at
        };
      }
    } catch (error) {
      console.error('Error parsing crew folder:', error);
    }
    
    const editedMember: CrewMember = {
      ...crewMember,
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      roles: updatedRoles,
      crew_folder: crewFolder || crewMember.crew_folder
    };

    onEditCrewMember(editedMember);
    setOpen(false);
  };

  const handleDelete = async () => {
    try {
      onDeleteCrewMember();
      setOpen(false);
      toast({
        title: "Crew members deleted",
        description: `${selectedCrew.length} crew member(s) have been removed`,
      });
    } catch (error) {
      console.error('Error deleting crew members:', error);
      toast({
        title: "Error",
        description: "Failed to delete crew members",
        variant: "destructive",
      });
    }
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
          <DialogDescription>
            Update the crew member's information and roles. All changes will be saved immediately.
          </DialogDescription>
        </DialogHeader>
        <EditCrewMemberForm
          crewMember={crewMember}
          selectedRoleIds={selectedRoleIds}
          onRolesChange={setSelectedRoleIds}
          onSubmit={handleSubmit}
          onDelete={handleDelete}
          folders={folders || []}
        />
      </DialogContent>
    </Dialog>
  );
}