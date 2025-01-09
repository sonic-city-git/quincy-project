import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface RolesHeaderProps {
  onAddClick?: () => void;
}

export function RolesHeader({ onAddClick }: RolesHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-lg font-semibold">Roles</h2>
      <Button 
        variant="outline" 
        size="sm"
        onClick={onAddClick}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add role
      </Button>
    </div>
  );
}