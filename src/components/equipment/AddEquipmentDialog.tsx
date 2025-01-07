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
      folderId: selectedFolder,
    };

    onAddEquipment(newEquipment);
    setOpen(false);
    setSerialNumbers(['']);
    setHasSerialNumbers(false);
    setSelectedFolder(null);
  };

  const addSerialNumberField = () => {
    setSerialNumbers(prev => [...prev, '']);
  };

  const updateSerialNumber = (index: number, value: string) => {
    setSerialNumbers(prev => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const removeSerialNumber = (index: number) => {
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
          <FolderSelect
            selectedFolder={selectedFolder}
            onFolderSelect={setSelectedFolder}
            required
          />
          <div className="grid gap-2">
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              name="code"
              placeholder="4U-AIR"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="Peli Air with 4U"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              name="price"
              type="number"
              step="0.01"
              placeholder="60.80"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="value">Book Value</Label>
            <Input
              id="value"
              name="value"
              type="number"
              step="0.01"
              placeholder="1500.00"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="weight">Weight (kg)</Label>
            <Input
              id="weight"
              name="weight"
              type="number"
              step="0.01"
              placeholder="10.50"
              required
            />
          </div>
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
            <div className="grid gap-2">
              <Label>Serial Numbers</Label>
              {serialNumbers.map((serialNumber, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`Serial number ${index + 1}`}
                    value={serialNumber}
                    onChange={(e) => updateSerialNumber(index, e.target.value)}
                    required
                  />
                  {serialNumbers.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeSerialNumber(index)}
                    >
                      ✕
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addSerialNumberField}
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Serial Number
              </Button>
              <p className="text-sm text-muted-foreground">
                Stock: {serialNumbers.filter(sn => sn.trim() !== '').length} items
              </p>
            </div>
          ) : (
            <div className="grid gap-2">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                placeholder="5"
                required={!hasSerialNumbers}
              />
            </div>
          )}
          <Button type="submit" className="mt-4">Add equipment</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
