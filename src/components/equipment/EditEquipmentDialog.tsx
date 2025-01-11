import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Equipment } from "@/integrations/supabase/types/equipment";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z.string().optional().or(z.literal("")),
  rental_price: z.string().optional().or(z.literal("")),
  stock: z.string().optional().or(z.literal("")),
  internal_remark: z.string().optional().or(z.literal("")),
});

type FormData = z.infer<typeof formSchema>;

interface EditEquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment: Equipment;
  onEquipmentDeleted?: () => void;
}

export function EditEquipmentDialog({ 
  open, 
  onOpenChange, 
  equipment, 
  onEquipmentDeleted 
}: EditEquipmentDialogProps) {
  const [isPending, setIsPending] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: equipment.Name || "",
      code: equipment.Code || "",
      rental_price: equipment.Price?.toString() || "",
      stock: equipment.Stock?.toString() || "",
      internal_remark: equipment["Internal remark"] || "",
    },
  });

  const handleDelete = async () => {
    setIsPending(true);
    try {
      const { error } = await supabase
        .from('equipment')
        .delete()
        .eq('id', equipment.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      onOpenChange(false);
      onEquipmentDeleted?.();
      toast.success("Equipment deleted successfully");
    } catch (error: any) {
      console.error("Error deleting equipment:", error);
      toast.error(error.message || "Failed to delete equipment");
    } finally {
      setIsPending(false);
      setShowDeleteAlert(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsPending(true);
    try {
      const { error } = await supabase
        .from('equipment')
        .update({
          Name: data.name,
          Code: data.code || null,
          Price: data.rental_price ? parseFloat(data.rental_price) : null,
          Stock: data.stock ? parseInt(data.stock) : null,
          "Internal remark": data.internal_remark || null,
        })
        .eq('id', equipment.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      onOpenChange(false);
      form.reset();
      toast.success("Equipment updated successfully");
    } catch (error: any) {
      console.error("Error updating equipment:", error);
      toast.error(error.message || "Failed to update equipment");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Equipment</DialogTitle>
            <DialogDescription>
              Make changes to the equipment's information below.
            </DialogDescription>
          </DialogHeader>
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
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rental_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rental Price</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Enter rental price" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Enter stock" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="internal_remark"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Internal Remark</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter internal remark" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteAlert(true)}
                >
                  Delete
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the equipment
              "{equipment.Name}" and all its associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}