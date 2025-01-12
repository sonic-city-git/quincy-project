import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Package, Plus, X } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { Folder } from "@/types/folders";
import { sortFolders } from "@/utils/folderSort";

interface EditEquipmentFormProps {
  form: UseFormReturn<any>;
  folders: Folder[];
  foldersLoading: boolean;
  isPending: boolean;
  onShowDeleteAlert: () => void;
  onShowRestockDialog: () => void;
}

export function EditEquipmentForm({
  form,
  folders,
  foldersLoading,
  isPending,
  onShowDeleteAlert,
  onShowRestockDialog
}: EditEquipmentFormProps) {
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit} className="space-y-4">
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
                        {sortFolders(folders).map((folder) => (
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

            {(stockCalculation === "manual" || stockCalculation === "consumable") && (
              <div className="space-y-4">
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
                {stockCalculation === "consumable" && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onShowRestockDialog}
                    className="w-full"
                    disabled={isPending}
                  >
                    <Package className="mr-2 h-4 w-4" />
                    Restock
                  </Button>
                )}
              </div>
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
            onClick={onShowDeleteAlert}
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
  );
}