import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useCrewRoles } from "@/hooks/useCrewRoles";
import { Project } from "@/types/projects";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCrew } from "@/hooks/useCrew";
import { useCrewSort } from "@/components/resources/crew/useCrewSort";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQueryClient } from "@tanstack/react-query";
import { SONIC_CITY_FOLDER_ID } from "@/constants/organizations";
import { FORM_PATTERNS, createCurrencyInput, cn } from "@/design-system";

interface AddRoleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  variantName: string;
  eventId?: string;
}

interface FormData {
  role_id: string;
  daily_rate: number;
  hourly_rate: number;
  preferred_id?: string;
}

export function AddRoleDialog({ isOpen, onClose, project, variantName }: AddRoleDialogProps) {
  const { roles } = useCrewRoles();
  // PERFORMANCE OPTIMIZATION: Use consistent folder ID for crew data
  const { crew } = useCrew(SONIC_CITY_FOLDER_ID);
  const { sortCrew } = useCrewSort();
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({
    defaultValues: {
      daily_rate: 7500,
      hourly_rate: 850
    }
  });

  const sortedCrew = sortCrew(crew || []);

  const onSubmit = async (data: FormData) => {
    try {
      // First get the variant_id from the variant_name
      const { data: variant, error: variantError } = await supabase
        .from('project_variants')
        .select('id')
        .eq('project_id', project.id)
        .eq('variant_name', variantName)
        .single();

      if (variantError || !variant) {
        throw new Error(`Failed to find variant: ${variantError?.message || 'Variant not found'}`);
      }
      
      // Add the project role
      const { error } = await supabase
        .from('project_roles')
        .insert({
          project_id: project.id,
          variant_id: variant.id,
          role_id: data.role_id,
          daily_rate: data.daily_rate,
          hourly_rate: data.hourly_rate,
          preferred_id: data.preferred_id || null
        });

      if (error) throw error;

      // Invalidate queries
      await Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: ['project-roles', project.id] 
        }),
        queryClient.invalidateQueries({ 
          queryKey: ['variant-crew', project.id, variantName] 
        }),
        queryClient.invalidateQueries({
          queryKey: ['project-event-roles']
        }),
        queryClient.invalidateQueries({
          queryKey: ['crew-sync-status']
        })
      ]);

      toast.success('Role added successfully');
      onClose();
    } catch (error) {
      console.error('Error adding role:', error);
      toast.error('Failed to add role');
    }
  };

  const currencyInputStyles = createCurrencyInput();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={FORM_PATTERNS.dialog.container}>
        <DialogHeader className={FORM_PATTERNS.dialog.header}>
          <DialogTitle>Add Role</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className={FORM_PATTERNS.dialog.content}>
          {/* Role Selection */}
          <div className={FORM_PATTERNS.field.default}>
            <Label htmlFor="role" className={FORM_PATTERNS.label.required}>Role</Label>
            <Select onValueChange={(value) => setValue('role_id', value)} required>
              <SelectTrigger className={FORM_PATTERNS.dropdown.trigger}>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent className={FORM_PATTERNS.dropdown.content}>
                {roles?.map((role) => (
                  <SelectItem 
                    key={role.id} 
                    value={role.id}
                    className={FORM_PATTERNS.dropdown.item}
                  >
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Daily Rate with Currency Symbol */}
          <div className={FORM_PATTERNS.field.default}>
            <Label htmlFor="daily_rate" className={FORM_PATTERNS.label.required}>Daily Rate</Label>
            <div className={currencyInputStyles.container}>
              <span className={currencyInputStyles.symbol}>kr</span>
              <Input
                type="number"
                step="1"
                required
                placeholder="7500"
                className={cn(currencyInputStyles.input, FORM_PATTERNS.input.default)}
                {...register('daily_rate', { valueAsNumber: true, required: true })}
              />
            </div>
          </div>

          {/* Hourly Rate with Currency Symbol */}
          <div className={FORM_PATTERNS.field.default}>
            <Label htmlFor="hourly_rate" className={FORM_PATTERNS.label.required}>Hourly Rate</Label>
            <div className={currencyInputStyles.container}>
              <span className={currencyInputStyles.symbol}>kr</span>
              <Input
                type="number"
                step="1"
                required
                placeholder="850"
                className={cn(currencyInputStyles.input, FORM_PATTERNS.input.default)}
                {...register('hourly_rate', { valueAsNumber: true, required: true })}
              />
            </div>
          </div>

          {/* Preferred Crew Member */}
          <div className={FORM_PATTERNS.field.default}>
            <Label className={FORM_PATTERNS.label.optional}>Preferred Crew Member</Label>
            <Select
              value={watch('preferred_id') || ''}
              onValueChange={(value) => setValue('preferred_id', value)}
            >
              <SelectTrigger className={FORM_PATTERNS.dropdown.trigger}>
                <SelectValue placeholder="Select preferred crew member" />
              </SelectTrigger>
              <SelectContent className={FORM_PATTERNS.dropdown.content}>
                <ScrollArea className="h-[200px]">
                  {sortedCrew.map((member) => {
                    const initials = member.name
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase();

                    return (
                      <SelectItem 
                        key={member.id} 
                        value={member.id}
                        className={cn(FORM_PATTERNS.dropdown.item, "flex items-center gap-3 py-2")}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            {member.avatar_url ? (
                              <AvatarImage 
                                src={member.avatar_url} 
                                alt={member.name} 
                                className="object-cover"
                              />
                            ) : (
                              <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                                {initials}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <span className="truncate">{member.name}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </ScrollArea>
              </SelectContent>
            </Select>
          </div>

          {/* Form Actions */}
          <div className={FORM_PATTERNS.dialog.footer}>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Add Role
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}