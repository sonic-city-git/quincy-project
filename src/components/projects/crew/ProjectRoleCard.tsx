import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ProjectRoleCardProps {
  id: string;
  projectId: string;
  name: string;
  color: string;
  quantity: number;
  dailyRate?: number | null;
  hourlyRate?: number | null;
  onUpdate?: () => void;
}

export function ProjectRoleCard({ 
  id,
  projectId,
  name, 
  color, 
  quantity,
  dailyRate,
  hourlyRate,
  onUpdate
}: ProjectRoleCardProps) {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [localDailyRate, setLocalDailyRate] = useState(dailyRate?.toString() || "");
  const [localHourlyRate, setLocalHourlyRate] = useState(hourlyRate?.toString() || "");

  const handleRateUpdate = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('project_roles')
        .update({
          daily_rate: localDailyRate ? parseFloat(localDailyRate) : null,
          hourly_rate: localHourlyRate ? parseFloat(localHourlyRate) : null,
        })
        .eq('project_id', projectId)
        .eq('role_id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Rates updated successfully",
      });

      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating rates:', error);
      toast({
        title: "Error",
        description: "Failed to update rates",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBlur = () => {
    if (
      (localDailyRate !== (dailyRate?.toString() || "")) || 
      (localHourlyRate !== (hourlyRate?.toString() || ""))
    ) {
      handleRateUpdate();
    }
  };

  return (
    <Card className="p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{quantity}×</span>
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          <div className="space-y-2">
            <h3 className="text-sm font-medium">{name}</h3>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-20">Daily rate:</span>
                <Input
                  type="number"
                  value={localDailyRate}
                  onChange={(e) => setLocalDailyRate(e.target.value)}
                  onBlur={handleBlur}
                  placeholder="Enter daily rate"
                  className="h-7 w-28"
                  disabled={isUpdating}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-20">Hourly rate:</span>
                <Input
                  type="number"
                  value={localHourlyRate}
                  onChange={(e) => setLocalHourlyRate(e.target.value)}
                  onBlur={handleBlur}
                  placeholder="Enter hourly rate"
                  className="h-7 w-28"
                  disabled={isUpdating}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}