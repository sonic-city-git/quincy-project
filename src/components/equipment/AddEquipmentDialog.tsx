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
import { SerialNumbersSection } from "./add/SerialNumbersSection";
import { BasicEquipmentFields } from "./add/BasicEquipmentFields";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { EquipmentFolderSelect } from "./EquipmentFolderSelect";

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
  const [stockCalculationMethod, setStockCalculationMethod] = useState<"manual" | "serial_numbers">("manual");
  const [manualStock, setManualStock] = useState("0");
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
      stock: stockCalculationMethod === "manual" ? parseInt(manualStock, 10) : validSerialNumbers.length,
      serialNumbers: stockCalculationMethod === "serial_numbers" ? validSerialNumbers : undefined,
      stockCalculationMethod,
      id: Math.random().toString(36).substr(2, 9),
      folder_id: selectedFolder,
    };

    onAddEquipment(newEquipment);
    setOpen(false);
    setSerialNumbers([{ number: "", status: "Available" }]);
    setSelectedFolder(null);
    setManualStock("0");
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
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Add Equipment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <BasicEquipmentFields required />
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
                  onAddSerialNumber={handleAddSerialNumber}
                  onRemoveSerialNumber={handleRemoveSerialNumber}
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
          <Button type="submit" className="mt-6 w-full">Add equipment</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}