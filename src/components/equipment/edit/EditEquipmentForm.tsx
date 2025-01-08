import { Equipment, SerialNumber } from "@/types/equipment";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { EquipmentFolderSelect } from "../EquipmentFolderSelect";
import { Label } from "@/components/ui/label";
import { BasicInfoSection } from "./sections/BasicInfoSection";
import { StockManagementSection } from "./sections/StockManagementSection";
import { TotalBookValueSection } from "./sections/TotalBookValueSection";

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

  const totalBookValue = useMemo(() => {
    const bookValue = parseFloat(equipment.value) || 0;
    const stock = stockCalculationMethod === "manual" 
      ? parseInt(manualStock, 10) 
      : serialNumbers.filter(sn => sn.number.trim() !== '').length;
    const total = Math.round(bookValue * stock);
    return total.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  }, [equipment.value, manualStock, serialNumbers, stockCalculationMethod]);

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

  const handleAddSerialNumber = () => {
    setSerialNumbers(prev => [...prev, { number: "", status: "Available" }]);
  };

  const handleRemoveSerialNumber = (index: number) => {
    setSerialNumbers(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className="py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          <BasicInfoSection equipment={equipment} />
          <TotalBookValueSection totalBookValue={totalBookValue} />
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <StockManagementSection
            stockCalculationMethod={stockCalculationMethod}
            manualStock={manualStock}
            serialNumbers={serialNumbers}
            onStockMethodChange={setStockCalculationMethod}
            onManualStockChange={setManualStock}
            onSerialNumberChange={handleSerialNumberChange}
            onAddSerialNumber={handleAddSerialNumber}
            onRemoveSerialNumber={handleRemoveSerialNumber}
          />

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