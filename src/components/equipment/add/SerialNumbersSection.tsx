import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { AddSerialNumberDialog } from "./AddSerialNumberDialog";
import { ScrollArea } from "@/components/ui/scroll-area";

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
      <ScrollArea className="h-[200px] border rounded-lg p-4">
        {serialNumbers.map((sn, index) => (
          <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
            <div>
              <p className="font-medium">{sn.number}</p>
              {sn.notes && <p className="text-sm text-muted-foreground">{sn.notes}</p>}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRemoveSerialNumber(index)}
            >
              Remove
            </Button>
          </div>
        ))}
        {serialNumbers.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No serial numbers added yet
          </p>
        )}
      </ScrollArea>
      
      <AddSerialNumberDialog onAddSerialNumber={(number: string, notes: string) => {
        onSerialNumberChange(serialNumbers.length, "number", number);
        if (notes) onSerialNumberChange(serialNumbers.length, "notes", notes);
        onAddSerialNumber();
      }} />

      <p className="text-sm text-muted-foreground">
        Stock: {serialNumbers.filter(sn => sn.number.trim() !== "").length} items
      </p>
    </div>
  );
}