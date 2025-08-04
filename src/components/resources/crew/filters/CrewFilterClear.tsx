import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CrewFilterClearProps {
  onClear: () => void;
}

export function CrewFilterClear({ onClear }: CrewFilterClearProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClear}
    >
      <X className="h-4 w-4" />
    </Button>
  );
}