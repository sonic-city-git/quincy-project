import { Button } from "@/components/ui/button";
import { Pen } from "lucide-react";

interface RoleSelectionActionsProps {
  selectedItems: string[];
  onEdit?: () => void;
}

export function RoleSelectionActions({ 
  selectedItems,
  onEdit 
}: RoleSelectionActionsProps) {
  if (selectedItems.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onEdit}
      >
        <Pen className="h-4 w-4 mr-2" />
        Edit
      </Button>
    </div>
  );
}