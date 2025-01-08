import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Calendar, AlertTriangle } from "lucide-react";
import { calculateAvailableStock, calculateTotalStock } from "@/utils/equipmentUtils";
import { Equipment } from "@/types/equipment";

interface EquipmentCardProps {
  equipment: Equipment;
  status: "Available" | "In Use" | "Maintenance";
  nextBooking?: string;
}

export function EquipmentCard({ 
  equipment,
  status, 
  nextBooking,
}: EquipmentCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available":
        return "bg-green-500";
      case "In Use":
        return "bg-blue-500";
      case "Maintenance":
        return "bg-amber-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStockDisplay = () => {
    if (equipment.stockCalculationMethod === 'serial_numbers' && equipment.serialNumbers) {
      const available = calculateAvailableStock(equipment.serialNumbers);
      const total = calculateTotalStock(equipment.serialNumbers);
      return `${available} / ${total}`;
    }
    return equipment.stock.toString();
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 font-inter">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span className="text-lg font-semibold">{equipment.name}</span>
          <Badge variant="outline" className={`${getStatusColor(status)} text-white border-none`}>
            {status}
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">{equipment.code}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>Stock: {getStockDisplay()}</span>
          </div>
          {nextBooking && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Next booking: {nextBooking}</span>
            </div>
          )}
          {status === "Maintenance" && (
            <div className="flex items-center gap-2 text-sm text-red-400">
              <AlertTriangle className="h-4 w-4" />
              <span>Under maintenance</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}