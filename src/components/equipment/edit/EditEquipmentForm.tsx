import { Equipment, SerialNumber } from "@/types/equipment";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { SerialNumbersSection } from "../add/SerialNumbersSection";
import { BasicEquipmentFields } from "../add/BasicEquipmentFields";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { EquipmentFolderSelect } from "../EquipmentFolderSelect";

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
  const [stockCalculationMethod, setStockCalculationMethod] = useState<"manual" | "serial_numbers">(
    equipment.stockCalculationMethod || "manual"
  );
  const [manualStock, setManualStock] = useState(equipment.stock.toString());
  const [serialNumbers, setSerialNumbers] = useState<SerialNumber[]>(
    equipment.serialNumbers?.length 
      ? equipment.serialNumbers 
      : [{ number: "", status: "Available" }]
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
      stock: stockCalculationMethod === "manual" ? parseInt(manualStock, 10) : validSerialNumbers.length,
      serialNumbers: stockCalculationMethod === "serial_numbers" ? validSerialNumbers : undefined,
      stockCalculationMethod,
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
    <form onSubmit={handleSubmit} className="py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
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
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label>Stock Calculation Method</Label>
            <Select
              value={stockCalculationMethod}
              onValueChange={(value: "manual" | "serial_numbers") => setStockCalculationMethod(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select stock calculation method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual Stock</SelectItem>
                <SelectItem value="serial_numbers">Serial Numbers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {stockCalculationMethod === "manual" ? (
            <div className="grid gap-2">
              <Label>Stock</Label>
              <Input
                type="number"
                min="0"
                value={manualStock}
                onChange={(e) => setManualStock(e.target.value)}
                required
              />
            </div>
          ) : (
            <SerialNumbersSection
              serialNumbers={serialNumbers}
              onSerialNumberChange={handleSerialNumberChange}
              onAddSerialNumber={addSerialNumberField}
              onRemoveSerialNumber={removeSerialNumber}
            />
          )}

          <div className="grid gap-2">
            <Label>Folder</Label>
            <EquipmentFolderSelect
              selectedFolder={selectedFolder}
              onFolderSelect={setSelectedFolder}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-6">
        <Button type="button" variant="destructive" onClick={onDelete}>
          Delete
        </Button>
        <Button type="submit">Save changes</Button>
      </div>
    </form>
  );
}