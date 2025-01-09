import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { AddMemberFormFields } from "./AddMemberFormFields";

interface AddMemberFormData {
  name: string;
  email: string;
  phone: string;
  role_ids: string[];
  folder_id: string;
}

export function AddMemberDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  
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
    try {
      // First, insert the crew member
      const { data: crewMember, error: crewError } = await supabase
        .from('crew_members')
        .insert({
          name: data.name,
          email: data.email || null,
          phone: data.phone || null,
          folder_id: data.folder_id || null,
        })
        .select()
        .single();

      if (crewError) {
        console.error('Error inserting crew member:', crewError);
        toast.error(crewError.message || "Failed to add crew member");
        return;
      }

      if (!crewMember) {
        toast.error("Failed to add crew member - no data returned");
        return;
      }

      // Then, if we have role IDs, insert the crew member roles
      if (data.role_ids.length > 0) {
        const roleInserts = data.role_ids.map(roleId => ({
          crew_member_id: crewMember.id,
          role_id: roleId
        }));

        const { error: rolesError } = await supabase
          .from('crew_member_roles')
          .insert(roleInserts);

        if (rolesError) {
          console.error('Error inserting crew member roles:', rolesError);
          toast.error("Member added but roles could not be assigned");
          return;
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['crew'] });
      
      toast.success("Crew member added successfully");
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error('Error adding crew member:', error);
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Crew Member</DialogTitle>
          <DialogDescription>
            Fill in the details below to add a new crew member to your team.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <AddMemberFormFields
              form={form}
              folders={folders}
              roles={roles}
              foldersLoading={foldersLoading}
              rolesLoading={rolesLoading}
            />
            <div className="flex justify-end pt-4">
              <Button type="submit">Add Member</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}