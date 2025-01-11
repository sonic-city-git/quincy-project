import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CustomerSelect } from "./CustomerSelect";
import { OwnerSelect } from "./OwnerSelect";
import { useForm } from "react-hook-form";

interface ProjectFormData {
  name: string;
  customer_id?: string;
  crew_member_id?: string;
}

interface ProjectFormProps {
  onSubmit: (data: ProjectFormData) => Promise<void>;
  onCancel: () => void;
}

export function ProjectForm({ onSubmit, onCancel }: ProjectFormProps) {
  const form = useForm<ProjectFormData>({
    defaultValues: {
      name: '',
      customer_id: undefined,
      crew_member_id: undefined
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="Project name"
              {...form.register('name')}
            />
          </div>

          <CustomerSelect
            value={form.watch('customer_id')}
            onChange={(value) => form.setValue('customer_id', value)}
          />

          <OwnerSelect
            value={form.watch('crew_member_id')}
            onChange={(value) => form.setValue('crew_member_id', value)}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit">
            Add Project
          </Button>
        </div>
      </form>
    </Form>
  );
}