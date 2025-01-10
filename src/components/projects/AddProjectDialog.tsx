import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EntitySelect } from "@/components/shared/EntitySelect";
import { useCustomers } from "@/hooks/useCustomers";
import { useCrew } from "@/hooks/useCrew";
import { useAddProject } from "@/hooks/useAddProject";
import { useFolders } from "@/hooks/useFolders";

interface AddProjectFormData {
  name: string;
  customer_id?: string;
  crew_member_id?: string;
}

interface AddProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddProjectDialog({ open, onOpenChange }: AddProjectDialogProps) {
  const { customers, loading: customersLoading } = useCustomers();
  const { crew, loading: crewLoading } = useCrew();
  const { folders } = useFolders();
  const addProject = useAddProject();

  const form = useForm<AddProjectFormData>({
    defaultValues: {
      name: '',
      customer_id: undefined,
      crew_member_id: undefined
    }
  });

  const onSubmit = async (data: AddProjectFormData) => {
    try {
      await addProject.mutateAsync(data);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to add project:', error);
    }
  };

  // Find Sonic City folder
  const sonicCityFolder = folders.find(folder => folder.name === 'Sonic City');
  
  // Filter crew members to only show those in Sonic City folder
  const filteredCrew = crew.filter(member => member.folder_id === sonicCityFolder?.id);

  const customerEntities = customers.map(customer => ({
    id: customer.id,
    name: customer.name
  }));

  const crewEntities = filteredCrew.map(member => ({
    id: member.id,
    name: member.name
  }));

  console.log('Customers:', customers);
  console.log('Customer entities:', customerEntities);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Project</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new project.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="Project name"
                  {...form.register('name')}
                />
              </div>

              <div className="space-y-2">
                <EntitySelect
                  entities={customerEntities}
                  value={form.watch('customer_id') ?? ''}
                  onValueChange={(value) => form.setValue('customer_id', value)}
                  placeholder="Select customer"
                  isLoading={customersLoading}
                />
              </div>

              <div className="space-y-2">
                <EntitySelect
                  entities={crewEntities}
                  value={form.watch('crew_member_id') ?? ''}
                  onValueChange={(value) => form.setValue('crew_member_id', value)}
                  placeholder="Select owner"
                  isLoading={crewLoading}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                Add Project
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}