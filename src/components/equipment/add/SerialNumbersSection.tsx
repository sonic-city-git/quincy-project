import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";

interface SerialNumbersSectionProps {
  serialNumbers: string[];
  onSerialNumberChange: (index: number, value: string) => void;
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
      {serialNumbers.map((serialNumber, index) => (
        <div key={index} className="flex gap-2">
          <Input
            placeholder={`Serial number ${index + 1}`}
            value={serialNumber}
            onChange={(e) => onSerialNumberChange(index, e.target.value)}
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
        Stock: {serialNumbers.filter(sn => sn.trim() !== '').length} items
      </p>
    </div>
  );
}