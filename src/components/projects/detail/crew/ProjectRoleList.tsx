import { useProjectRoles } from "@/hooks/useProjectRoles";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCrew } from "@/hooks/useCrew";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCrewSort } from "@/components/crew/useCrewSort";

interface ProjectRoleListProps {
  projectId: string;
}

export function ProjectRoleList({ projectId }: ProjectRoleListProps) {
  const { roles, loading, refetch } = useProjectRoles(projectId);
  const { crew } = useCrew();
  const { sortCrew } = useCrewSort();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleRateChange = async (roleId: string, field: 'daily_rate' | 'hourly_rate', value: string) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('project_roles')
        .update({ [field]: parseFloat(value) || 0 })
        .eq('id', roleId);

      if (error) throw error;
      await refetch();
      toast.success('Rate updated successfully');
    } catch (error) {
      console.error('Error updating rate:', error);
      toast.error('Failed to update rate');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePreferredChange = async (roleId: string, preferredId: string) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('project_roles')
        .update({ preferred_id: preferredId })
        .eq('id', roleId);

      if (error) throw error;
      await refetch();
      toast.success('Preferred member updated');
    } catch (error) {
      console.error('Error updating preferred member:', error);
      toast.error('Failed to update preferred member');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading || isUpdating) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (roles.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No roles added yet
      </div>
    );
  }

  // Sort the crew members using the useCrewSort hook
  const sortedCrew = sortCrew(crew || []);

  return (
    <div className="space-y-4">
      {roles.map((role) => (
        <Card key={role.id} className="p-4 bg-zinc-900/50">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <h3 className="font-medium truncate">{role.role.name}</h3>
            </div>
            
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <Input
                type="number"
                inputMode="decimal"
                pattern="[0-9]*"
                className="w-32 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                defaultValue={role.daily_rate?.toString()}
                placeholder="Daily rate"
                onBlur={(e) => handleRateChange(role.id, 'daily_rate', e.target.value)}
              />
              
              <Input
                type="number"
                inputMode="decimal"
                pattern="[0-9]*"
                className="w-32 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                defaultValue={role.hourly_rate?.toString()}
                placeholder="Hourly rate"
                onBlur={(e) => handleRateChange(role.id, 'hourly_rate', e.target.value)}
              />
              
              <Select
                defaultValue={role.preferred?.id}
                onValueChange={(value) => handlePreferredChange(role.id, value)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select preferred" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] overflow-y-auto">
                  {sortedCrew.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}