import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";

interface SerialNumber {
  number: string;
  status: "Available" | "In Use" | "Maintenance";
  notes?: string;
}

interface SerialNumbersSectionProps {
  serialNumbers: SerialNumber[];
  onSerialNumberChange: (index: number, field: keyof SerialNumber, value: string) => void;
  onAddSerialNumber: () => void;
  onRemoveSerialNumber: (index: number) => void;
}

export function SerialNumbersSection({
  serialNumbers,
  onSerialNumberChange,
  onAddSerialNumber,
  onRemoveSerialNumber,
}: SerialNumbersSectionProps) {
  return (
    <div className="grid gap-2">
      <Label>Serial Numbers</Label>
      {serialNumbers.map((sn, index) => (
        <div key={index} className="grid gap-2 p-4 border rounded-lg">
          <div className="flex gap-2">
            <Input
              placeholder={`Serial number ${index + 1}`}
              value={sn.number}
              onChange={(e) => onSerialNumberChange(index, "number", e.target.value)}
              required
            />
            {serialNumbers.length > 1 && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => onRemoveSerialNumber(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="grid gap-2">
            <Label>Notes</Label>
            <Input
              placeholder="Optional notes"
              value={sn.notes || ""}
              onChange={(e) => onSerialNumberChange(index, "notes", e.target.value)}
            />
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={onAddSerialNumber}
        className="mt-2"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Serial Number
      </Button>
      <p className="text-sm text-muted-foreground">
        Stock: {serialNumbers.filter(sn => sn.number.trim() !== "").length} items
      </p>
    </div>
  );
}