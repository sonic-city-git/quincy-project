import { Card } from "@/components/ui/card";

interface ProjectRoleCardProps {
  name: string;
  color: string;
  quantity: number;
  dailyRate?: number | null;
  hourlyRate?: number | null;
}

export function ProjectRoleCard({ 
  name, 
  color, 
  quantity,
  dailyRate,
  hourlyRate 
}: ProjectRoleCardProps) {
  return (
    <Card className="p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{quantity}×</span>
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          <div>
            <h3 className="text-sm font-medium">{name}</h3>
            <div className="text-xs text-muted-foreground space-y-0.5">
              {dailyRate && (
                <p>Daily rate: ${dailyRate}</p>
              )}
              {hourlyRate && (
                <p>Hourly rate: ${hourlyRate}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}