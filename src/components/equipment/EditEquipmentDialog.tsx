import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Wrench } from "lucide-react";
import { useState } from "react";
import { Equipment } from "@/types/equipment";
import { EditEquipmentForm } from "./edit/EditEquipmentForm";

interface EditEquipmentDialogProps {
  equipment: Equipment;
  onEditEquipment: (editedEquipment: Equipment) => void;
  onDeleteEquipment: () => void;
}

export function EditEquipmentDialog({
  equipment,
  onEditEquipment,
  onDeleteEquipment,
}: EditEquipmentDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSubmit = (editedEquipment: Equipment) => {
    onEditEquipment(editedEquipment);
    setOpen(false);
  };

  const handleDelete = () => {
    onDeleteEquipment();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Wrench className="h-4 w-4" />
          EDIT
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Edit Equipment</DialogTitle>
        </DialogHeader>
        <EditEquipmentForm
          equipment={equipment}
          onSubmit={handleSubmit}
          onDelete={handleDelete}
        />
      </DialogContent>
    </Dialog>
  );
}