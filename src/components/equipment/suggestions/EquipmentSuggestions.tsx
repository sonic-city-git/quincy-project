import { ScrollArea } from "@/components/ui/scroll-area";
import { Equipment } from "@/types/equipment";

interface EquipmentSuggestionsProps {
  equipment: Equipment;
  onClose?: () => void;
}

export function EquipmentSuggestions({ equipment, onClose }: EquipmentSuggestionsProps) {
  return (
    <div className="space-y-4">
      {suggestions && (
        <ScrollArea className="h-[300px] rounded-md border p-4">
          <div className="whitespace-pre-line text-sm">
            {suggestions}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}