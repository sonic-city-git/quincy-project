import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { EntitySelect } from "@/components/shared/EntitySelect";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

interface AddRoleFormData {
  roleId: string;
  dailyRate: string;
  hourlyRate: string;
}

interface AddRoleDialogProps {
  projectId: string;
  onSubmit: (data: AddRoleFormData) => void;
  trigger?: React.ReactNode;
}

export function AddRoleDialog({ projectId, onSubmit, trigger }: AddRoleDialogProps) {
  const [open, setOpen] = useState(false);
  const form = useForm<AddRoleFormData>({
    defaultValues: {
      roleId: "",
      dailyRate: "",
      hourlyRate: "",
    },
  });

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['crew-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crew_roles')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async (data: AddRoleFormData) => {
    onSubmit(data);
    setOpen(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Role</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="roleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <FormControl>
                    <EntitySelect
                      entities={roles.map(role => ({
                        id: role.id,
                        name: role.name
                      }))}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="role"
                      isLoading={isLoading}
                      required
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dailyRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Daily Rate</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter daily rate"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hourlyRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hourly Rate</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter hourly rate"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">Add Role</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}