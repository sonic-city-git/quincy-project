import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EntitySelect } from "@/components/shared/EntitySelect";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { CrewRole } from "@/hooks/useCrewRoles";
import { sortRoles } from "@/utils/roleUtils";
import { UseFormReturn } from "react-hook-form";
import { Folder } from "@/types/folders";

interface EditMemberFormProps {
  form: UseFormReturn<any>;
  onSubmit: (data: any) => void;
  isPending: boolean;
  folders: Folder[];
  foldersLoading: boolean;
  roles: CrewRole[];
  rolesLoading: boolean;
  onDelete: () => void;
}

export function EditMemberForm({
  form,
  onSubmit,
  isPending,
  folders,
  foldersLoading,
  roles,
  rolesLoading,
  onDelete,
}: EditMemberFormProps) {
  const sortedRoles = sortRoles(roles);

  return (
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
                  entities={folders.map(f => ({ id: f.id, name: f.name }))}
                  value={field.value || ""}
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
          render={() => (
            <FormItem>
              <FormLabel>Roles</FormLabel>
              <div className="grid grid-cols-2 gap-4 border rounded-lg p-4 bg-zinc-900/50">
                {rolesLoading ? (
                  <div className="col-span-2 flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : sortedRoles.length === 0 ? (
                  <div className="col-span-2 text-center py-4 text-muted-foreground">
                    No roles available
                  </div>
                ) : (
                  sortedRoles.map((role) => (
                    <div 
                      key={role.id} 
                      className="flex items-center space-x-2 rounded p-2 transition-colors"
                      style={{ backgroundColor: role.color, opacity: 1 }}
                    >
                      <Checkbox
                        id={role.id}
                        checked={form.watch('role_ids')?.includes(role.id)}
                        onCheckedChange={(checked) => {
                          const currentRoles = form.watch('role_ids') || [];
                          const newRoles = checked
                            ? [...currentRoles, role.id]
                            : currentRoles.filter(id => id !== role.id);
                          form.setValue('role_ids', newRoles);
                        }}
                        className="data-[state=checked]:bg-white/90 data-[state=checked]:border-white/90 border-white/70"
                      />
                      <label
                        htmlFor={role.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-white"
                      >
                        {role.name}
                      </label>
                    </div>
                  ))
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-between">
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={onDelete}
            className="gap-2"
          >
            Delete Member
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}