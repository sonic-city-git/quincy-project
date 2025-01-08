import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { RoleInfo } from "./RoleInfo";

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
    <Card className="p-2">
      <div className="flex items-center gap-6">
        <RoleInfo quantity={quantity} color={color} name={name} />
        <div className="flex items-center gap-6">
          <Input
            type="number"
            value={localDailyRate}
            onChange={(e) => setLocalDailyRate(e.target.value)}
            onBlur={handleBlur}
            className="h-7 w-24"
            disabled={isUpdating}
          />
          <Input
            type="number"
            value={localHourlyRate}
            onChange={(e) => setLocalHourlyRate(e.target.value)}
            onBlur={handleBlur}
            className="h-7 w-24"
            disabled={isUpdating}
          />
        </div>
      </div>
    </Card>
  );
}