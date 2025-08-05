import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Trash2, User, Mail, Phone, Folder, Users } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { Folder as FolderType } from "@/integrations/supabase/types/folder";
import { CrewRole } from "@/hooks/useCrewRoles";
import { sortRoles } from "@/utils/roleUtils";
import { getRoleBadgeStyle, FORM_PATTERNS, createInputClasses, createFieldIconClasses, createFormFieldContainer } from "@/design-system";

interface EditMemberFormProps {
  form: UseFormReturn<any>;
  onSubmit: (data: any) => void;
  isPending: boolean;
  folders: FolderType[];
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
      <form onSubmit={form.handleSubmit(onSubmit)} className={FORM_PATTERNS.layout.singleColumn}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={FORM_PATTERNS.label.required}>Full Name</FormLabel>
              <FormControl>
                <div className={createFormFieldContainer(true)}>
                  <User className={createFieldIconClasses()} />
                  <Input 
                    placeholder="Ola Nordmann"
                    className={createInputClasses('withIcon')}
                    {...field} 
                  />
                </div>
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
              <FormLabel className={FORM_PATTERNS.label.optional}>Email Address</FormLabel>
              <FormControl>
                <div className={createFormFieldContainer(true)}>
                  <Mail className={createFieldIconClasses()} />
                  <Input 
                    type="email" 
                                                placeholder="navn@firma.no"
                    className={createInputClasses('withIcon')}
                    {...field} 
                  />
                </div>
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
              <FormLabel className={FORM_PATTERNS.label.optional}>Phone Number</FormLabel>
              <FormControl>
                <div className={createFormFieldContainer(true)}>
                  <Phone className={createFieldIconClasses()} />
                  <Input 
                                                placeholder="+47 123 45 678"
                    className={createInputClasses('withIcon')}
                    {...field} 
                  />
                </div>
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
              <FormLabel className={FORM_PATTERNS.label.optional}>Crew Folder</FormLabel>
              <div className={createFormFieldContainer(true)}>
                <Folder className={createFieldIconClasses()} />
                <Select 
                  value={field.value || "_none"} 
                  onValueChange={(value) => field.onChange(value === "_none" ? "" : value)}
                  disabled={foldersLoading}
                >
                  <FormControl>
                    <SelectTrigger className={createInputClasses('withIcon')}>
                      <SelectValue placeholder="Select crew folder" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="_none">None</SelectItem>
                    {folders.map(folder => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role_ids"
          render={() => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Roles
                <span className="text-xs text-muted-foreground">(optional)</span>
              </FormLabel>
              <div className={FORM_PATTERNS.layout.fieldset}>
                {rolesLoading ? (
                  <div className="col-span-2 flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : sortedRoles.length === 0 ? (
                  <div className="col-span-2 text-center py-4 text-muted-foreground">
                    No roles available
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {sortedRoles.map((role) => (
                      <div 
                        key={role.id} 
                        className="flex items-center space-x-2 rounded p-2 transition-colors"
                        style={getRoleBadgeStyle(role.name)}
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
                        className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {role.name}
                      </label>
                    </div>
                    ))}
                  </div>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className={FORM_PATTERNS.dialog.footer}>
          <Button
            type="button"
            variant="destructive"
            onClick={onDelete}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Member
          </Button>
          <Button type="submit" disabled={isPending} className="min-w-[120px]">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Member
          </Button>
        </div>
      </form>
    </Form>
  );
}