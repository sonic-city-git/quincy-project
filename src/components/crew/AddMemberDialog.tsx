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
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const addMemberSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  role_ids: z.array(z.string()),
  folder_id: z.string().min(1, "Folder is required"),
});

type AddMemberFormData = z.infer<typeof addMemberSchema>;

export function AddMemberDialog() {
  const [open, setOpen] = useState(false);
  const { addMember } = useAddMember();
  
  const form = useForm<AddMemberFormData>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      role_ids: [],
      folder_id: ''
    } as AddMemberFormData
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
    try {
      const success = await addMember(data);
      if (success) {
        setOpen(false);
        form.reset();
        toast.success("Crew member added successfully");
      }
    } catch (error) {
      console.error('Error in onSubmit:', error);
      toast.error("Failed to add crew member");
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