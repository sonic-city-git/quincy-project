import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SerialNumbersSection } from "../../add/SerialNumbersSection";
import { SerialNumber } from "@/types/equipment";

interface StockManagementSectionProps {
  stockCalculationMethod: "manual" | "serial_numbers";
  manualStock: string;
  serialNumbers: SerialNumber[];
  onStockMethodChange: (value: "manual" | "serial_numbers") => void;
  onManualStockChange: (value: string) => void;
  onSerialNumberChange: (index: number, field: keyof SerialNumber, value: string) => void;
  onAddSerialNumber: () => void;
  onRemoveSerialNumber: (index: number) => void;
}

export function StockManagementSection({
  stockCalculationMethod,
  manualStock,
  serialNumbers,
  onStockMethodChange,
  onManualStockChange,
  onSerialNumberChange,
  onAddSerialNumber,
  onRemoveSerialNumber,
}: StockManagementSectionProps) {
  return (
    <>
      <div className="grid gap-2">
        <Label>Stock Calculation Method</Label>
        <Select
          value={stockCalculationMethod}
          onValueChange={onStockMethodChange}
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
            onChange={(e) => onManualStockChange(e.target.value)}
            required
          />
        </div>
      ) : (
        <SerialNumbersSection
          serialNumbers={serialNumbers}
          onSerialNumberChange={onSerialNumberChange}
          onAddSerialNumber={onAddSerialNumber}
          onRemoveSerialNumber={onRemoveSerialNumber}
        />
      )}
    </>
  );
}