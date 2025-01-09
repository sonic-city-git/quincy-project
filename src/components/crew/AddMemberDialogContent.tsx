import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { UseFormReturn } from "react-hook-form";
import { AddMemberFormFields } from "./AddMemberFormFields";

interface AddMemberFormData {
  name: string;
  email: string;
  phone: string;
  role_ids: string[];
  folder_id: string;
}

interface AddMemberDialogContentProps {
  form: UseFormReturn<AddMemberFormData>;
  folders: { id: string; name: string; }[];
  roles: { id: string; name: string; }[];
  foldersLoading: boolean;
  rolesLoading: boolean;
  onSubmit: (data: AddMemberFormData) => Promise<void>;
}

export function AddMemberDialogContent({
  form,
  folders,
  roles,
  foldersLoading,
  rolesLoading,
  onSubmit
}: AddMemberDialogContentProps) {
  return (
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
  );
}