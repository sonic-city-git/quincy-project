import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CrewFilterClearProps {
  onClear: () => void;
}

export function CrewFilterClear({ onClear }: CrewFilterClearProps) {
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