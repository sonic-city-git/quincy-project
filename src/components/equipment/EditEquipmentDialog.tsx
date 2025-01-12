import { useState, useEffect } from "react";
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
import { Loader2, Plus, X } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useFolders } from "@/hooks/useFolders";
import { sortFolders } from "@/utils/folderSort";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z.string().optional().or(z.literal("")),
  rental_price: z.string().optional().or(z.literal("")),
  stock_calculation: z.enum(["manual", "serial_numbers"]),
  stock: z.string().optional().or(z.literal("")),
  internal_remark: z.string().optional().or(z.literal("")),
  serial_numbers: z.array(z.string()).optional(),
  folder_id: z.string().optional().nullable(),
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
  const [serialNumbers, setSerialNumbers] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const { folders = [], loading: foldersLoading } = useFolders();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: equipment.name || "",
      code: equipment.code || "",
      rental_price: equipment.rental_price?.toString() || "",
      stock_calculation: equipment.stock_calculation as "manual" | "serial_numbers" || "manual",
      stock: equipment.stock?.toString() || "",
      internal_remark: equipment.internal_remark || "",
      serial_numbers: [],
      folder_id: equipment.folder_id || null,
    },
  });

  useEffect(() => {
    const fetchSerialNumbers = async () => {
      const { data } = await supabase
        .from('equipment_serial_numbers')
        .select('serial_number')
        .eq('equipment_id', equipment.id);
      
      if (data) {
        const numbers = data.map(d => d.serial_number);
        setSerialNumbers(numbers);
        form.setValue("serial_numbers", numbers);
      }
    };

    if (equipment.stock_calculation === "serial_numbers") {
      fetchSerialNumbers();
    }
  }, [equipment.id, equipment.stock_calculation]);

  const stockCalculation = form.watch("stock_calculation");

  const addSerialNumber = () => {
    const currentSerialNumbers = form.getValues("serial_numbers") || [];
    form.setValue("serial_numbers", [...currentSerialNumbers, ""]);
  };

  const removeSerialNumber = (index: number) => {
    const currentSerialNumbers = form.getValues("serial_numbers") || [];
    form.setValue(
      "serial_numbers",
      currentSerialNumbers.filter((_, i) => i !== index)
    );
  };

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
      const { error: equipmentError } = await supabase
        .from('equipment')
        .update({
          name: data.name,
          code: data.code || null,
          rental_price: data.rental_price ? parseFloat(data.rental_price) : null,
          stock: data.stock_calculation === "manual" ? (data.stock ? parseInt(data.stock) : null) : data.serial_numbers?.length || 0,
          stock_calculation: data.stock_calculation,
          internal_remark: data.internal_remark || null,
          folder_id: data.folder_id || null,
        })
        .eq('id', equipment.id);

      if (equipmentError) throw equipmentError;

      if (data.stock_calculation === "serial_numbers" && data.serial_numbers?.length) {
        // Delete existing serial numbers
        await supabase
          .from('equipment_serial_numbers')
          .delete()
          .eq('equipment_id', equipment.id);

        // Insert new serial numbers
        const { error: serialNumberError } = await supabase
          .from('equipment_serial_numbers')
          .insert(
            data.serial_numbers.map(serial => ({
              equipment_id: equipment.id,
              serial_number: serial,
              status: 'Available'
            }))
          );

        if (serialNumberError) throw serialNumberError;
      }

      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      onOpenChange(false);
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Equipment</DialogTitle>
            <DialogDescription>
              Make changes to the equipment's information below.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
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
                    name="folder_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Folder</FormLabel>
                        <Select
                          disabled={foldersLoading}
                          onValueChange={field.onChange}
                          value={field.value || undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a folder" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {sortFolders(folders).map((folder) => (
                              <SelectItem 
                                key={folder.id} 
                                value={folder.id}
                                className={folder.parent_id ? "pl-6 italic" : ""}
                              >
                                {folder.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="stock_calculation"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Stock Calculation Method</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="manual" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Manual Stock Count
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="serial_numbers" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Track Serial Numbers
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {stockCalculation === "manual" && (
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
                  )}

                  {stockCalculation === "serial_numbers" && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <FormLabel>Serial Numbers</FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addSerialNumber}
                          className="h-8"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Serial Number
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {form.watch("serial_numbers")?.map((_, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              placeholder={`Serial number ${index + 1}`}
                              value={form.watch(`serial_numbers.${index}`)}
                              onChange={(e) => {
                                const newSerialNumbers = [...(form.getValues("serial_numbers") || [])];
                                newSerialNumbers[index] = e.target.value;
                                form.setValue("serial_numbers", newSerialNumbers);
                              }}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeSerialNumber(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

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
                </div>
              </div>
              <div className="flex justify-between pt-4">
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
              "{equipment.name}" and all its associated data.
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
