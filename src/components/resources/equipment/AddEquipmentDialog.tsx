import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { useDialogState } from "@/components/shared/dialogs/useDialogState";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Package, Plus, X } from "lucide-react";
import { useFolders } from "@/hooks/useFolders";
import { sortEquipmentFolders } from "@/utils/equipmentFolderSort";
import { ScrollArea } from "@/components/ui/scroll-area";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z.string().optional().or(z.literal("")),
  rental_price: z.string().optional().or(z.literal("")),
  stock_calculation: z.enum(["manual", "serial_numbers", "consumable"]),
  stock: z.string().optional().or(z.literal("")),
  internal_remark: z.string().optional().or(z.literal("")),
  serial_numbers: z.array(z.string()).optional(),
  folder_id: z.string().optional().nullable(),
});

type FormData = z.infer<typeof formSchema>;

interface AddEquipmentDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddEquipmentDialog({ open: externalOpen, onOpenChange: externalOnOpenChange }: AddEquipmentDialogProps = {}) {
  // Use consolidated dialog state management
  const { open, setOpen } = useDialogState({ 
    open: externalOpen, 
    onOpenChange: externalOnOpenChange 
  });
  const [isPending, setIsPending] = useState(false);
  const queryClient = useQueryClient();
  const { folders = [], loading: foldersLoading } = useFolders();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      code: "",
      rental_price: "",
      stock_calculation: "manual",
      stock: "",
      internal_remark: "",
      serial_numbers: [],
      folder_id: null,
    },
  });

  const stockCalculation = form.watch("stock_calculation");
  const serialNumbers = form.watch("serial_numbers") || [];

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

  const onSubmit = async (data: FormData) => {
    setIsPending(true);
    try {
      const { error: equipmentError, data: equipmentData } = await supabase
        .from('equipment')
        .insert([
          {
            name: data.name,
            code: data.code || null,
            rental_price: data.rental_price ? parseFloat(data.rental_price) : null,
            stock: data.stock_calculation === "manual" ? (data.stock ? parseInt(data.stock) : null) : data.serial_numbers?.length || 0,
            stock_calculation: data.stock_calculation,
            internal_remark: data.internal_remark || null,
            folder_id: data.folder_id || null,
          }
        ])
        .select()
        .single();

      if (equipmentError) throw equipmentError;

      if (data.stock_calculation === "serial_numbers" && data.serial_numbers?.length) {
        const { error: serialNumberError } = await supabase
          .from('equipment_serial_numbers')
          .insert(
            data.serial_numbers.map(serial => ({
              equipment_id: equipmentData.id,
              serial_number: serial,
              status: 'Available'
            }))
          );

        if (serialNumberError) throw serialNumberError;
      }

      queryClient.invalidateQueries({ queryKey: ['project-equipment'] });
      setOpen(false);
      form.reset();
      toast.success("Equipment added successfully");
    } catch (error: any) {
      console.error("Error adding equipment:", error);
      toast.error(error.message || "Failed to add equipment");
    } finally {
      setIsPending(false);
    }
  };

  // Show trigger button only when not externally controlled
  const showTrigger = externalOpen === undefined;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button>
            <Package className="h-4 w-4 mr-2" />
            Add Equipment
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Equipment</DialogTitle>
          <DialogDescription>
            Fill in the details below to add new equipment to your inventory.
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
                          <ScrollArea className="h-[200px]">
                            {sortEquipmentFolders(folders).map((folder) => (
                              <SelectItem 
                                key={folder.id} 
                                value={folder.id}
                                className={!folder.parent_id ? "font-medium" : "pl-[2.5rem] italic"}
                              >
                                {folder.name}
                              </SelectItem>
                            ))}
                          </ScrollArea>
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
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="consumable" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Consumable
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
                      {serialNumbers.map((_, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            placeholder={`Serial number ${index + 1}`}
                            value={serialNumbers[index]}
                            onChange={(e) => {
                              const newSerialNumbers = [...serialNumbers];
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
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Equipment
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
