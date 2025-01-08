import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";

interface RoleItemProps {
  name: string;
  color: string;
  quantity?: number;
  onAdd?: () => void;
  onUpdateQuantity?: (increment: boolean) => void;
  loading?: boolean;
}

export function RoleItem({ 
  name, 
  color, 
  quantity, 
  onAdd, 
  onUpdateQuantity,
  loading 
}: RoleItemProps) {
  if (quantity !== undefined) {
    return (
      <div
        className="flex items-center justify-between py-1.5 px-2 rounded-md w-full"
        style={{ backgroundColor: color + '20' }}
      >
        <div className="flex items-center space-x-2">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-sm">{name}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Button 
            variant="ghost" 
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onUpdateQuantity?.(false)}
            disabled={loading}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="text-sm min-w-[20px] text-center">{quantity}</span>
          <Button 
            variant="ghost" 
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onUpdateQuantity?.(true)}
            disabled={loading}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

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