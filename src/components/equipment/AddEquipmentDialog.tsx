import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Equipment } from "@/types/equipment";
import { EditEquipmentForm } from "./edit/EditEquipmentForm";

interface AddEquipmentDialogProps {
  onAddEquipment: (equipment: Equipment) => void;
}

export function AddEquipmentDialog({ onAddEquipment }: AddEquipmentDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSubmit = (newEquipment: Equipment) => {
    onAddEquipment(newEquipment);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild id="add-equipment-trigger">
        <span className="hidden">Add Equipment</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Add Equipment</DialogTitle>
        </DialogHeader>
        <EditEquipmentForm
          equipment={{
            id: '',
            code: '',
            name: '',
            price: '0',
            value: '0',
            weight: '0',
            stock: 0,
            stockCalculationMethod: 'manual'
          }}
          onSubmit={handleSubmit}
          onDelete={() => setOpen(false)}
          mode="add"
        />
      </DialogContent>
    </Dialog>
  );
}