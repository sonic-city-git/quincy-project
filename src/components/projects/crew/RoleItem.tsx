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
        className="flex items-center justify-between p-3 rounded-md w-full"
        style={{ backgroundColor: color + '20' }}
      >
        <div className="flex items-center space-x-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-sm font-medium">{name}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onUpdateQuantity?.(false)}
            disabled={loading}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[20px] text-center">{quantity}</span>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onUpdateQuantity?.(true)}
            disabled={loading}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      className="flex items-center justify-between p-3 h-auto w-full"
      onClick={onAdd}
      disabled={loading}
    >
      <span className="text-sm font-medium">{name}</span>
      <Plus className="h-4 w-4 ml-2" />
    </Button>
  );
}