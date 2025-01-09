import { Button } from "@/components/ui/button";
import { Pen } from "lucide-react";

interface RoleSelectionActionsProps {
  selectedItems: string[];
  onEdit: () => void;
}

export function RoleSelectionActions({ selectedItems, onEdit }: RoleSelectionActionsProps) {
  if (selectedItems.length === 0) return null;

  return (
    <div className="flex gap-2 mb-4">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onEdit}
        className="bg-zinc-900"
      >
        <Pen className="h-4 w-4 mr-2" />
        Edit
      </Button>
    </div>
  );
}