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
import { Checkbox } from "@/components/ui/checkbox";
import { Equipment } from "@/types/equipment";
import { FolderSelect } from "./shared/FolderSelect";
import { SerialNumbersSection } from "./add/SerialNumbersSection";
import { BasicEquipmentFields } from "./add/BasicEquipmentFields";
import { Label } from "@/components/ui/label";

interface AddEquipmentDialogProps {
  onAddEquipment: (newEquipment: Equipment) => void;
}

interface SerialNumber {
  number: string;
  status: "Available" | "In Use" | "Maintenance";
  notes?: string;
}

export function AddEquipmentDialog({ onAddEquipment }: AddEquipmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [hasSerialNumbers, setHasSerialNumbers] = useState(true); // Default to true since we now always use serial numbers
  const [serialNumbers, setSerialNumbers] = useState<SerialNumber[]>([{
    number: "",
    status: "Available"
  }]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const validSerialNumbers = serialNumbers.filter(sn => sn.number.trim() !== "");

    const newEquipment: Equipment = {
      code: formData.get("code") as string,
      name: formData.get("name") as string,
      price: formData.get("price") as string,
      value: formData.get("value") as string,
      weight: formData.get("weight") as string,
      stock: validSerialNumbers.length,
      serialNumbers: validSerialNumbers.map(sn => ({
        number: sn.number,
        status: sn.status,
        notes: sn.notes
      })),
      id: Math.random().toString(36).substr(2, 9),
      folder_id: selectedFolder,
    };

    onAddEquipment(newEquipment);
    setOpen(false);
    setSerialNumbers([{ number: "", status: "Available" }]);
    setSelectedFolder(null);
  };

  const handleSerialNumberChange = (index: number, field: keyof SerialNumber, value: string) => {
    setSerialNumbers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddSerialNumber = () => {
    setSerialNumbers(prev => [...prev, { number: "", status: "Available" }]);
  };

  const handleRemoveSerialNumber = (index: number) => {
    setSerialNumbers(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add equipment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Equipment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <BasicEquipmentFields required />
          
          <SerialNumbersSection
            serialNumbers={serialNumbers}
            onSerialNumberChange={handleSerialNumberChange}
            onAddSerialNumber={handleAddSerialNumber}
            onRemoveSerialNumber={handleRemoveSerialNumber}
          />

          <div className="grid gap-2">
            <Label>Folder</Label>
            <FolderSelect
              selectedFolder={selectedFolder}
              onFolderSelect={setSelectedFolder}
              required
              showAllFolders={false}
            />
          </div>
          <Button type="submit" className="mt-4">Add equipment</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}