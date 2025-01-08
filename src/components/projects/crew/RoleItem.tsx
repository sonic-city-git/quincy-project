import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface RoleItemProps {
  name: string;
  color: string;
  onAdd?: () => void;
  loading?: boolean;
}

export function RoleItem({ 
  name, 
  color, 
  onAdd,
  loading 
}: RoleItemProps) {
  return (
    <Button
      variant="outline"
      className="flex items-center justify-between py-1.5 px-2 h-8 w-full"
      onClick={onAdd}
      disabled={loading}
    >
      <span className="text-sm">{name}</span>
      <Plus className="h-3 w-3 ml-2" />
    </Button>
  );
}