import { useState } from "react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { AddMemberDialogContent } from "./AddMemberDialogContent";
import { useAddMember } from "@/hooks/useAddMember";

interface AddMemberFormData {
  name: string;
  email: string;
  phone: string;
  role_ids: string[];
  folder_id: string;
}

export function AddMemberDialog() {
  const [open, setOpen] = useState(false);
  const { addMember } = useAddMember();
  
  const form = useForm<AddMemberFormData>({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      role_ids: [],
      folder_id: ''
    }
  });

  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['crew_roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crew_roles')
        .select('id, name')
        .order('name');
      
      if (error) {
        console.error('Error loading roles:', error);
        toast.error("Failed to load roles");
        throw error;
      }
      return data || [];
    },
  });

  const { data: folders = [], isLoading: foldersLoading } = useQuery({
    queryKey: ['crew_folders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crew_folders')
        .select('id, name')
        .order('name');
      
      if (error) {
        console.error('Error loading folders:', error);
        toast.error("Failed to load folders");
        throw error;
      }
      return data || [];
    },
  });

  const onSubmit = async (data: AddMemberFormData) => {
    const success = await addMember(data);
    if (success) {
      setOpen(false);
      form.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="primary" size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add Member
        </Button>
      </DialogTrigger>
      <AddMemberDialogContent
        form={form}
        folders={folders}
        roles={roles}
        foldersLoading={foldersLoading}
        rolesLoading={rolesLoading}
        onSubmit={onSubmit}
      />
    </Dialog>
  );
}