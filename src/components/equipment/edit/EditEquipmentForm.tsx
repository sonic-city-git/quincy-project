import { Equipment, SerialNumber } from "@/types/equipment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [serialNumbers, setSerialNumbers] = useState<SerialNumber[]>(
    equipment.serialNumbers || [{ number: "", status: "Available" }]
  );
  const [selectedFolder, setSelectedFolder] = useState<string | null>(equipment.folder_id || null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const validSerialNumbers = serialNumbers.filter(sn => sn.number.trim() !== '');

    const editedEquipment: Equipment = {
      ...equipment,
      code: formData.get("code") as string,
      name: formData.get("name") as string,
      price: formData.get("price") as string,
      value: formData.get("value") as string,
      weight: formData.get("weight") as string,
      stock: validSerialNumbers.length,
      serialNumbers: validSerialNumbers,
      folder_id: selectedFolder,
    };

    onSubmit(editedEquipment);
  };

  const handleSerialNumberChange = (index: number, field: keyof SerialNumber, value: string) => {
    setSerialNumbers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addSerialNumberField = () => {
    setSerialNumbers(prev => [...prev, { number: "", status: "Available" }]);
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

      <SerialNumbersSection
        serialNumbers={serialNumbers}
        onSerialNumberChange={handleSerialNumberChange}
        onAddSerialNumber={addSerialNumberField}
        onRemoveSerialNumber={removeSerialNumber}
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

      <div className="flex justify-between items-center">
        <Button type="submit">Save changes</Button>
        <Button type="button" variant="destructive" onClick={onDelete}>
          Delete
        </Button>
      </div>
    </form>
  );
}