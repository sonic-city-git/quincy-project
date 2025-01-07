import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Users, Package } from "lucide-react";

interface ProjectCardProps {
  title: string;
  customer: string;
  equipmentCount: number;
  staffCount: number;
  nextBooking?: string;
}

export function ProjectCard({ title, customer, equipmentCount, staffCount, nextBooking }: ProjectCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span className="text-lg font-semibold">{title}</span>
          <Badge variant="outline" className="text-blue-600">
            Active
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">{customer}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>{equipmentCount} items</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{staffCount} staff assigned</span>
          </div>
          {nextBooking && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              <span>Next booking: {nextBooking}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}