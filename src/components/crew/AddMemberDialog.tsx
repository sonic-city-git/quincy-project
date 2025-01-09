import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { EntitySelect } from "@/components/shared/EntitySelect";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";

interface AddMemberFormData {
  name: string;
  email: string;
  phone: string;
  role_ids: string[];
}

export function AddMemberDialog() {
  const [open, setOpen] = useState(false);
  const form = useForm<AddMemberFormData>();

  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['crew_roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crew_roles')
        .select('*');
      
      if (error) throw error;
      return data;
    },
  });

  const onSubmit = async (data: AddMemberFormData) => {
    try {
      // First create the crew member
      const { data: crewMember, error: crewError } = await supabase
        .from('crew_members')
        .insert([{
          name: data.name,
          email: data.email,
          phone: data.phone,
        }])
        .select()
        .single();

      if (crewError) throw crewError;

      // Then create the role associations
      const roleAssignments = data.role_ids.map(role_id => ({
        crew_member_id: crewMember.id,
        role_id: role_id
      }));

      const { error: rolesError } = await supabase
        .from('crew_member_roles')
        .insert(roleAssignments);

      if (rolesError) throw rolesError;

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
              name="role_ids"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Roles</FormLabel>
                  <FormControl>
                    <EntitySelect
                      entities={roles}
                      value={field.value || []}
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