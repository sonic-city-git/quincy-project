import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Equipment } from "@/integrations/supabase/types/equipment";
import { useFolders } from "@/hooks/useFolders";
import { DeleteEquipmentAlert } from "./edit/DeleteEquipmentAlert";
import { RestockDialog } from "./edit/RestockDialog";
import { EditEquipmentForm } from "./edit/EditEquipmentForm";

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
  const [isRestocking, setIsRestocking] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showRestockDialog, setShowRestockDialog] = useState(false);
  const [restockAmount, setRestockAmount] = useState("");
  const queryClient = useQueryClient();
  const { folders = [], loading: foldersLoading } = useFolders();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: equipment.name || "",
      code: equipment.code || "",
      rental_price: equipment.rental_price?.toString() || "",
      stock_calculation: equipment.stock_calculation as "manual" | "serial_numbers" | "consumable" || "manual",
      stock: equipment.stock?.toString() || "",
      internal_remark: equipment.internal_remark || "",
      serial_numbers: [],
      folder_id: equipment.folder_id || null,
    },
  });

  const handleRestock = async () => {
    if (!restockAmount || parseInt(restockAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsRestocking(true);
    try {
      const currentStock = equipment.stock || 0;
      const newStock = currentStock + parseInt(restockAmount);

      const { error } = await supabase
        .from('equipment')
        .update({ stock: newStock })
        .eq('id', equipment.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      setShowRestockDialog(false);
      setRestockAmount("");
      toast.success("Stock updated successfully");
    } catch (error: any) {
      console.error("Error updating stock:", error);
      toast.error(error.message || "Failed to update stock");
    } finally {
      setIsRestocking(false);
    }
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
          stock: data.stock_calculation === "manual" || data.stock_calculation === "consumable" 
            ? (data.stock ? parseInt(data.stock) : null) 
            : data.serial_numbers?.length || 0,
          stock_calculation: data.stock_calculation,
          internal_remark: data.internal_remark || null,
          folder_id: data.folder_id || null,
        })
        .eq('id', equipment.id);

      if (equipmentError) throw equipmentError;

      if (data.stock_calculation === "serial_numbers" && data.serial_numbers?.length) {
        await supabase
          .from('equipment_serial_numbers')
          .delete()
          .eq('equipment_id', equipment.id);

        await supabase
          .from('equipment_serial_numbers')
          .insert(
            data.serial_numbers.map(serial => ({
              equipment_id: equipment.id,
              serial_number: serial,
              status: 'Available'
            }))
          );
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Equipment</DialogTitle>
            <DialogDescription>
              Make changes to the equipment's information below.
            </DialogDescription>
          </DialogHeader>
          
          <EditEquipmentForm
            form={form}
            folders={folders}
            foldersLoading={foldersLoading}
            isPending={isPending}
            onShowDeleteAlert={() => setShowDeleteAlert(true)}
            onShowRestockDialog={() => setShowRestockDialog(true)}
            onSubmit={onSubmit}
          />
        </DialogContent>
      </Dialog>

      <DeleteEquipmentAlert
        open={showDeleteAlert}
        onOpenChange={setShowDeleteAlert}
        equipment={equipment}
        onDelete={handleDelete}
        isPending={isPending}
      />

      <RestockDialog
        open={showRestockDialog}
        onOpenChange={setShowRestockDialog}
        restockAmount={restockAmount}
        onRestockAmountChange={setRestockAmount}
        onRestock={handleRestock}
        isRestocking={isRestocking}
      />
    </>
  );
}
