import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { EntitySelect } from "@/components/shared/EntitySelect";
import { UseFormReturn } from "react-hook-form";

interface AddMemberFormData {
  name: string;
  email: string;
  phone: string;
  role_ids: string[];
  folder_id: string;
}

interface AddMemberFormFieldsProps {
  form: UseFormReturn<AddMemberFormData>;
  folders: { id: string; name: string; }[];
  roles: { id: string; name: string; }[];
  foldersLoading: boolean;
  rolesLoading: boolean;
}

export function AddMemberFormFields({ 
  form, 
  folders, 
  roles, 
  foldersLoading, 
  rolesLoading 
}: AddMemberFormFieldsProps) {
  return (
    <>
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
    </>
  );
}