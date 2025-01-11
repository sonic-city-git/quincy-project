import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EquipmentFilterClearProps {
  onClear: () => void;
}

export function EquipmentFilterClear({ onClear }: EquipmentFilterClearProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClear}
      className="gap-2"
    >
      <X className="h-4 w-4" />
      Clear filters
    </Button>
  );
}