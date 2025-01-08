import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";
import { Input } from "@/components/ui/input";

interface RoleItemProps {
  name: string;
  color: string;
  quantity?: number;
  dailyRate?: number;
  hourlyRate?: number;
  onAdd?: () => void;
  onUpdateQuantity?: (increment: boolean) => void;
  onUpdateRates?: (dailyRate: number | null, hourlyRate: number | null) => void;
  loading?: boolean;
}

export function RoleItem({ 
  name, 
  color, 
  quantity, 
  dailyRate,
  hourlyRate,
  onAdd, 
  onUpdateQuantity,
  onUpdateRates,
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
        <div className="flex items-center space-x-3">
          {quantity > 0 && (
            <>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  placeholder="Daily"
                  className="h-7 w-24"
                  value={dailyRate || ''}
                  onChange={(e) => {
                    const value = e.target.value ? parseFloat(e.target.value) : null;
                    onUpdateRates?.(value, hourlyRate);
                  }}
                  disabled={loading}
                />
                <Input
                  type="number"
                  placeholder="Hourly"
                  className="h-7 w-24"
                  value={hourlyRate || ''}
                  onChange={(e) => {
                    const value = e.target.value ? parseFloat(e.target.value) : null;
                    onUpdateRates?.(dailyRate, value);
                  }}
                  disabled={loading}
                />
              </div>
            </>
          )}
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