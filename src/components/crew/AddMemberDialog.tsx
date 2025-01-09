import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { EntitySelect } from "@/components/shared/EntitySelect";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";

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
      console.log('Fetching folders...');
      const { data, error } = await supabase
        .from('crew_folders')
        .select('id, name')
        .order('name');
      
      if (error) {
        console.error('Error loading folders:', error);
        toast.error("Failed to load folders");
        throw error;
      }
      console.log('Folders fetched:', data);
      return data || [];
    },
  });

  const onSubmit = async (data: AddMemberFormData) => {
    try {
      const { error: crewError } = await supabase
        .from('crew_members')
        .insert([{
          name: data.name,
          email: data.email,
          phone: data.phone,
          folder_id: data.folder_id,
        }]);

      if (crewError) {
        console.error('Error inserting crew member:', crewError);
        toast.error("Failed to add crew member");
        return;
      }

      // Refresh the crew query
      await queryClient.invalidateQueries({ queryKey: ['crew'] });
      
      toast.success("Crew member added successfully");
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error('Error adding crew member:', error);
      toast.error("Failed to add crew member");
    }
  };

  console.log('Current folders state:', folders);

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
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="folder_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Folder</FormLabel>
                  <FormControl>
                    <EntitySelect
                      entities={folders}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select folder"
                      isLoading={foldersLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role_ids"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Roles</FormLabel>
                  <FormControl>
                    <EntitySelect
                      entities={roles}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select roles"
                      isLoading={rolesLoading}
                      multiple={true}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
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