import { useForm } from "react-hook-form";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CustomerSelect } from "./CustomerSelect";
import { OwnerSelect } from "./OwnerSelect";
import { Loader2, FolderOpen, Users, User, Settings } from "lucide-react";
import { FORM_PATTERNS, createInputClasses, createFieldIconClasses, createFormFieldContainer, createDropdownClasses, getRandomLegendaryArtist } from "@/design-system";

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
  // Get a random legendary artist for the placeholder - only once per form instance
  const [randomArtistPlaceholder] = useState(() => getRandomLegendaryArtist());
  
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
      <form onSubmit={form.handleSubmit(onSubmit)} className={FORM_PATTERNS.layout.singleColumn} autoComplete="off">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={FORM_PATTERNS.label.required}>Project Name</FormLabel>
              <FormControl>
                <div className={createFormFieldContainer(true)}>
                  <FolderOpen className={createFieldIconClasses()} />
                  <Input
                    placeholder={randomArtistPlaceholder}
                    autoComplete="off"
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
          name="customer_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={FORM_PATTERNS.label.required}>Customer</FormLabel>
              <FormControl>
                <div className={createDropdownClasses('iconContainer')}>
                  <Users className={createDropdownClasses('iconInside')} />
                  <CustomerSelect
                    value={field.value}
                    onChange={field.onChange}
                    required
                    className={createDropdownClasses('triggerWithIcon')}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="crew_member_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={FORM_PATTERNS.label.required}>Project Owner</FormLabel>
              <FormControl>
                <div className={createDropdownClasses('iconContainer')}>
                  <User className={createDropdownClasses('iconInside')} />
                  <OwnerSelect
                    value={field.value}
                    onChange={field.onChange}
                    required
                    className={createDropdownClasses('triggerWithIcon')}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="project_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={FORM_PATTERNS.label.required}>Project Type</FormLabel>
              <FormControl>
                <div className={createDropdownClasses('iconContainer')}>
                  <Settings className={createDropdownClasses('iconInside')} />
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className={createDropdownClasses('triggerWithIcon')}>
                      <SelectValue placeholder="Select project type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="artist">Artist</SelectItem>
                      <SelectItem value="corporate">Corporate</SelectItem>
                      <SelectItem value="broadcast">Broadcast</SelectItem>
                      <SelectItem value="dry_hire">Dry Hire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className={FORM_PATTERNS.dialog.footer}>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={form.formState.isSubmitting}
            className="min-w-[120px]"
          >
            {form.formState.isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create Project
          </Button>
        </div>
      </form>
    </Form>
  );
}