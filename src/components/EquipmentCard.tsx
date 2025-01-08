import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Calendar, AlertTriangle } from "lucide-react";

interface EquipmentCardProps {
  name: string;
  category: string;
  status: "Available" | "In Use" | "Maintenance";
  nextBooking?: string;
  serialNumber: string;
  totalStock: number;
  availableStock: number;
}

export function EquipmentCard({ 
  name, 
  category, 
  status, 
  nextBooking, 
  serialNumber, 
  totalStock,
  availableStock 
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

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 font-inter">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span className="text-lg font-semibold">{name}</span>
          <Badge variant="outline" className={`${getStatusColor(status)} text-white border-none`}>
            {status}
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">{category}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>SN: {serialNumber}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>Stock: {availableStock} / {totalStock}</span>
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