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
    <div className="space-y-2">
      <div className="flex items-center gap-6 px-3">
        <div className="min-w-[200px]" />
        <div className="flex items-center gap-6">
          <span className="text-xs text-muted-foreground w-24">Daily rate</span>
          <span className="text-xs text-muted-foreground w-24">Hourly rate</span>
        </div>
      </div>
      <Card className="p-3">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 min-w-[200px]">
            <span className="text-sm text-muted-foreground">{quantity}×</span>
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: color }}
            />
            <h3 className="text-sm font-medium">{name}</h3>
          </div>
          <div className="flex items-center gap-6">
            <Input
              type="number"
              value={localDailyRate}
              onChange={(e) => setLocalDailyRate(e.target.value)}
              onBlur={handleBlur}
              placeholder="Daily rate"
              className="h-7 w-24"
              disabled={isUpdating}
            />
            <Input
              type="number"
              value={localHourlyRate}
              onChange={(e) => setLocalHourlyRate(e.target.value)}
              onBlur={handleBlur}
              placeholder="Hourly rate"
              className="h-7 w-24"
              disabled={isUpdating}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}