import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Equipment } from "@/types/equipment";
import { FolderSelect } from "./shared/FolderSelect";
import { SerialNumbersSection } from "./add/SerialNumbersSection";
import { BasicEquipmentFields } from "./add/BasicEquipmentFields";

interface AddEquipmentDialogProps {
  onAddEquipment: (newEquipment: Equipment) => void;
}

export function AddEquipmentDialog({ onAddEquipment }: AddEquipmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [hasSerialNumbers, setHasSerialNumbers] = useState(false);
  const [serialNumbers, setSerialNumbers] = useState<string[]>(['']);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const serialNumbersList = hasSerialNumbers 
      ? serialNumbers.filter(sn => sn.trim() !== '')
      : [];

    const newEquipment: Equipment = {
      code: formData.get("code") as string,
      name: formData.get("name") as string,
      price: formData.get("price") as string,
      value: formData.get("value") as string,
      weight: formData.get("weight") as string,
      stock: hasSerialNumbers ? serialNumbersList.length : Number(formData.get("stock")),
      serialNumbers: serialNumbersList,
      id: Math.random().toString(36).substr(2, 9),
      folder_id: selectedFolder,
    };

    onAddEquipment(newEquipment);
    setOpen(false);
    setSerialNumbers(['']);
    setHasSerialNumbers(false);
    setSelectedFolder(null);
  };

  const handleSerialNumberChange = (index: number, value: string) => {
    setSerialNumbers(prev => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const handleAddSerialNumber = () => {
    setSerialNumbers(prev => [...prev, '']);
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
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasSerialNumbers"
              checked={hasSerialNumbers}
              onCheckedChange={(checked) => setHasSerialNumbers(checked as boolean)}
            />
            <Label htmlFor="hasSerialNumbers" className="text-sm font-normal">
              This equipment requires serial numbers
            </Label>
          </div>

          {hasSerialNumbers ? (
            <SerialNumbersSection
              serialNumbers={serialNumbers}
              onSerialNumberChange={handleSerialNumberChange}
              onAddSerialNumber={handleAddSerialNumber}
              onRemoveSerialNumber={handleRemoveSerialNumber}
            />
          ) : (
            <div className="grid gap-2">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                placeholder="5"
                required
              />
            </div>
          )}

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