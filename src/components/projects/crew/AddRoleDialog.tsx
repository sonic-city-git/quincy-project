import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { sortRoles } from "@/utils/roleUtils";
import { AddRoleFormFields } from "./add/AddRoleFormFields";

interface AddRoleFormData {
  roleId: string;
  dailyRate: string;
  hourlyRate: string;
}

interface AddRoleDialogProps {
  projectId: string;
  onSubmit: (data: AddRoleFormData) => void;
  trigger: React.ReactNode;
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

  const { data: unsortedRoles = [], isLoading } = useQuery({
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

  const roles = sortRoles(unsortedRoles);

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
            <AddRoleFormFields 
              form={form}
              roles={roles}
              isLoading={isLoading}
            />
            <Button type="submit" className="w-full">Add Role</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}