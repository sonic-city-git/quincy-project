import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { useState } from "react";

interface EditRoleFormData {
  dailyRate: string;
  hourlyRate: string;
}

interface EditRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: EditRoleFormData) => void;
  initialData: {
    name: string;
    dailyRate?: number | null;
    hourlyRate?: number | null;
  };
}

export function EditRoleDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  initialData 
}: EditRoleDialogProps) {
  const form = useForm<EditRoleFormData>({
    defaultValues: {
      dailyRate: initialData.dailyRate?.toString() || "",
      hourlyRate: initialData.hourlyRate?.toString() || "",
    },
  });

  const handleSubmit = (data: EditRoleFormData) => {
    onSubmit(data);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {initialData.name}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="dailyRate"
              rules={{ required: "Daily rate is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Daily Rate</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter daily rate"
                      required
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hourlyRate"
              rules={{ required: "Hourly rate is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hourly Rate</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter hourly rate"
                      required
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">Save Changes</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}