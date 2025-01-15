import { useProjectRoles } from "@/hooks/useProjectRoles";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCrew } from "@/hooks/useCrew";
import { useCrewSort } from "@/components/crew/useCrewSort";
import { HourlyCategory } from "@/integrations/supabase/types/crew";

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

  const handleCategoryChange = async (roleId: string, category: HourlyCategory) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('project_roles')
        .update({ hourly_category: category })
        .eq('id', roleId);

      if (error) throw error;
      await refetch();
      toast.success('Rate category updated');
    } catch (error) {
      console.error('Error updating rate category:', error);
      toast.error('Failed to update rate category');
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

  const sortedCrew = sortCrew(crew || []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[200px_1fr] gap-4 px-4 mb-2">
        <div>Role</div>
        <div className="grid grid-cols-4 gap-4">
          <div>Daily rate</div>
          <div>Hourly rate</div>
          <div>Rate Category</div>
          <div>Preferred crew</div>
        </div>
      </div>
      {roles.map((role) => (
        <Card key={role.id} className="p-4 bg-zinc-900/50">
          <div className="grid grid-cols-[200px_1fr] gap-4">
            <div className="flex-shrink-0">
              <span 
                className="inline-block px-3 py-1 rounded-md text-sm font-medium text-white"
                style={{ 
                  backgroundColor: role.role?.color
                }}
              >
                {role.role?.name}
              </span>
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              <Input
                type="number"
                inputMode="decimal"
                pattern="[0-9]*"
                max={99999}
                className="w-24 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                defaultValue={role.daily_rate?.toString()}
                placeholder="Daily rate"
                onBlur={(e) => handleRateChange(role.id, 'daily_rate', e.target.value)}
              />
              
              <Input
                type="number"
                inputMode="decimal"
                pattern="[0-9]*"
                max={99999}
                className="w-24 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                defaultValue={role.hourly_rate?.toString()}
                placeholder="Hourly rate"
                onBlur={(e) => handleRateChange(role.id, 'hourly_rate', e.target.value)}
              />

              <Select
                defaultValue={role.hourly_category || 'flat'}
                onValueChange={(value) => handleCategoryChange(role.id, value as HourlyCategory)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flat">Flat Rate</SelectItem>
                  <SelectItem value="corporate">Corporate Rate</SelectItem>
                  <SelectItem value="broadcast">Broadcast Rate</SelectItem>
                </SelectContent>
              </Select>
              
              <Select
                defaultValue={role.preferred?.id}
                onValueChange={(value) => handlePreferredChange(role.id, value)}
              >
                <SelectTrigger className="w-full">
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