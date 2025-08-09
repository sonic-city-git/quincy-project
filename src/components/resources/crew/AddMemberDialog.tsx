import { useState } from "react";
import { FormDialog } from "@/components/shared/dialogs/FormDialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAddMember, AddMemberData } from "@/hooks/crew";
import { useCrewFolders } from "@/hooks/crew";
import { useCrewRoles } from "@/hooks/crew";
import { Loader2, UserPlus, User, Mail, Phone, Folder, Users } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { sortRoles } from "@/utils/roleUtils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getRoleBadgeStyle, FORM_PATTERNS, createInputClasses, createFieldIconClasses, createFormFieldContainer } from "@/design-system";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  folder_id: z.string().optional(),
  role_ids: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AddMemberDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddMemberDialog({ open: externalOpen, onOpenChange: externalOnOpenChange }: AddMemberDialogProps = {}) {
  const { mutate: addMember, isPending } = useAddMember();
  const { folders, loading: foldersLoading } = useCrewFolders();
  const { roles, isLoading: rolesLoading, refetch: refetchRoles } = useCrewRoles();
  
  // Internal state for when dialog is not externally controlled
  const [internalOpen, setInternalOpen] = useState(false);
  const isExternallyControlled = externalOpen !== undefined;
  const open = isExternallyControlled ? externalOpen : internalOpen;

  // Refetch roles when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      refetchRoles();
    }
    
    if (isExternallyControlled && externalOnOpenChange) {
      externalOnOpenChange(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      folder_id: "",
      role_ids: [],
    },
  });

  const onSubmit = async (data: FormData) => {
    const memberData: AddMemberData = {
      name: data.name,
      email: data.email || undefined,
      phone: data.phone || undefined,
      folder_id: data.folder_id || undefined,
      role_ids: data.role_ids || [],
    };
    
    addMember(memberData, {
      onSuccess: () => {
        handleOpenChange(false);
        form.reset();
        toast.success("Crew member added successfully");
      },
      onError: (error: any) => {
        console.error("Error adding crew member:", error);
        toast.error(error.message || "Failed to add crew member");
      },
    });
  };

  const sortedRoles = sortRoles(roles);

  return (
    <>
      {!isExternallyControlled && (
        <Button className="gap-2" onClick={() => handleOpenChange(true)}>
          <UserPlus className="h-4 w-4" />
          Add Member
        </Button>
      )}
      
      <FormDialog
        open={open}
        onOpenChange={handleOpenChange}
        title="Add New Crew Member"
        description="Fill in the details below to add a new crew member to your team."
        size="lg"
      >
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
                      value={field.value} 
                      onValueChange={field.onChange}
                      disabled={foldersLoading}
                    >
                      <FormControl>
                        <SelectTrigger className={createInputClasses('withIcon')}>
                          <SelectValue placeholder="Select crew folder" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : sortedRoles.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        No roles available
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {sortedRoles.map((role) => (
                          <div 
                            key={role.id} 
                            className="inline-flex items-center space-x-1.5 rounded px-2 py-1 transition-colors text-xs"
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
                              aria-describedby={`role-${role.id}-description`}
                            />
                            <label
                              htmlFor={role.id}
                              className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {role.name}
                            </label>
                            <span id={`role-${role.id}-description`} className="sr-only">
                              Select {role.name} role for this crew member
                            </span>
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
                type="submit" 
                disabled={isPending || rolesLoading || foldersLoading}
                className="min-w-[120px]"
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Member
              </Button>
            </div>
          </form>
        </Form>
      </FormDialog>
    </>
  );
}
