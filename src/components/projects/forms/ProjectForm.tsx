import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CustomerSelect } from "./CustomerSelect";
import { OwnerSelect } from "./OwnerSelect";
import { useForm } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProjectFormData {
  name: string;
  customer_id: string;
  crew_member_id: string;
  project_type: 'artist' | 'corporate' | 'broadcast' | 'dry_hire';
}

interface ProjectFormProps {
  onSubmit: (data: ProjectFormData) => Promise<void>;
  onCancel: () => void;
}

export function ProjectForm({ onSubmit, onCancel }: ProjectFormProps) {
  const form = useForm<ProjectFormData>({
    defaultValues: {
      name: '',
      customer_id: '',
      crew_member_id: '',
      project_type: 'artist'
    },
    mode: 'onBlur'
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
        <div className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="Project name"
              autoComplete="off"
              {...form.register('name', { required: "Project name is required" })}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <CustomerSelect
              value={form.watch('customer_id')}
              onChange={(value) => form.setValue('customer_id', value)}
              error={form.formState.errors.customer_id?.message}
              required
            />
            {form.formState.errors.customer_id && (
              <p className="text-sm text-red-500">Customer is required</p>
            )}
          </div>

          <div className="space-y-2">
            <OwnerSelect
              value={form.watch('crew_member_id')}
              onChange={(value) => form.setValue('crew_member_id', value)}
              error={form.formState.errors.crew_member_id?.message}
              required
            />
            {form.formState.errors.crew_member_id && (
              <p className="text-sm text-red-500">Owner is required</p>
            )}
          </div>

          <div className="space-y-2">
            <Select
              value={form.watch('project_type')}
              onValueChange={(value) => form.setValue('project_type', value as ProjectFormData['project_type'])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select project type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="artist">Artist</SelectItem>
                <SelectItem value="corporate">Corporate</SelectItem>
                <SelectItem value="broadcast">Broadcast</SelectItem>
                <SelectItem value="dry_hire">Dry Hire</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.project_type && (
              <p className="text-sm text-red-500">Project type is required</p>
            )}
          </div>
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