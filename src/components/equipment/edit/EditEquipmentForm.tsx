import { Equipment } from "@/types/equipment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { SerialNumbersSection } from "../add/SerialNumbersSection";
import { FolderSelect } from "../shared/FolderSelect";
import { BasicEquipmentFields } from "../add/BasicEquipmentFields";

interface EditEquipmentFormProps {
  equipment: Equipment;
  onSubmit: (editedEquipment: Equipment) => void;
  onDelete: () => void;
}

export function EditEquipmentForm({
  equipment,
  onSubmit,
  onDelete,
}: EditEquipmentFormProps) {
  const [hasSerialNumbers, setHasSerialNumbers] = useState(!!equipment.serialNumbers);
  const [serialNumbers, setSerialNumbers] = useState<string[]>(
    equipment.serialNumbers || ['']
  );
  const [selectedFolder, setSelectedFolder] = useState<string | null>(equipment.folder_id || null);

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
      folder_id: selectedFolder,
    };

    onSubmit(editedEquipment);
  };

  const handleSerialNumberChange = (index: number, value: string) => {
    setSerialNumbers(prev => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const addSerialNumberField = () => {
    setSerialNumbers(prev => [...prev, '']);
  };

  const removeSerialNumber = (index: number) => {
    setSerialNumbers(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <BasicEquipmentFields 
        defaultValues={{
          code: equipment.code,
          name: equipment.name,
          price: equipment.price,
          value: equipment.value,
          weight: equipment.weight,
        }}
        required 
      />
      
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
          onAddSerialNumber={addSerialNumberField}
          onRemoveSerialNumber={removeSerialNumber}
        />
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
        <Button type="button" variant="destructive" onClick={onDelete}>
          Delete
        </Button>
      </div>
    </form>
  );
}