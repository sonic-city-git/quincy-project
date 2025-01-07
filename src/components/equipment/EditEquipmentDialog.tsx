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
import { Wrench, Plus, X } from "lucide-react";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Equipment } from "@/types/equipment";
import { FolderSelect } from "./shared/FolderSelect";

interface EditEquipmentDialogProps {
  equipment: Equipment;
  onEditEquipment: (editedEquipment: Equipment) => void;
  onDeleteEquipment: () => void;
}

export function EditEquipmentDialog({ equipment, onEditEquipment, onDeleteEquipment }: EditEquipmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [hasSerialNumbers, setHasSerialNumbers] = useState(!!equipment.serialNumbers);
  const [serialNumbers, setSerialNumbers] = useState<string[]>(
    equipment.serialNumbers || ['']
  );
  const [selectedFolder, setSelectedFolder] = useState<string | null>(equipment.folderId || null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const serialNumbersList = hasSerialNumbers 
      ? serialNumbers.filter(sn => sn.trim() !== '')
      : [];

    const editedEquipment: Equipment = {
      ...equipment,
      code: formData.get("code") as string,
      name: formData.get("name") as string,
      price: formData.get("price") as string,
      value: formData.get("value") as string,
      weight: formData.get("weight") as string,
      stock: hasSerialNumbers ? serialNumbersList.length : Number(formData.get("stock")),
      serialNumbers: serialNumbersList,
      folderId: selectedFolder,
    };

    onEditEquipment(editedEquipment);
    setOpen(false);
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
        <Button variant="ghost" size="sm" className="gap-2">
          <Wrench className="h-4 w-4" />
          EDIT
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Equipment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              name="code"
              placeholder="4U-AIR"
              defaultValue={equipment.code}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="Peli Air with 4U"
              defaultValue={equipment.name}
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
              defaultValue={equipment.price}
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
              defaultValue={equipment.value}
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
              defaultValue={equipment.weight}
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
                      <X className="h-4 w-4" />
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
                defaultValue={equipment.stock}
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
          <div className="flex justify-between items-center">
            <Button type="submit">Save changes</Button>
            <Button type="button" variant="destructive" onClick={onDeleteEquipment}>
              Delete
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}