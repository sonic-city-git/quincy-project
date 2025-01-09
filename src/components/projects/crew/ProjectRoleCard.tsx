import { Card } from "@/components/ui/card";
import { RoleInfo } from "./RoleInfo";
import { PreferredCrewSelect } from "./PreferredCrewSelect";
import { supabase } from "@/integrations/supabase/client";

interface ProjectRoleCardProps {
  id: string;
  projectId: string;
  roleId: string;
  name: string;
  color: string;
  dailyRate?: number | null;
  hourlyRate?: number | null;
  preferredId?: string | null;
  onUpdate?: () => void;
}

export function ProjectRoleCard({ 
  id,
  projectId,
  roleId,
  name, 
  color, 
  dailyRate,
  hourlyRate,
  preferredId,
  onUpdate
}: ProjectRoleCardProps) {
  const handlePreferredChange = async (crewId: string) => {
    const { error } = await supabase
      .from('project_roles')
      .update({ preferred_id: crewId })
      .eq('id', id);

    if (error) {
      console.error('Error updating preferred crew member:', error);
      return;
    }

    if (onUpdate) {
      onUpdate();
    }
  };

  return (
    <Card className="p-2">
      <div className="flex items-center">
        <RoleInfo color={color} name={name} />
        <div className="grid grid-cols-[200px,200px,1fr] gap-6">
          <span className="text-sm pl-1 flex items-center -ml-[20px]">{dailyRate || '-'}</span>
          <span className="text-sm pl-1 flex items-center -ml-[80px]">{hourlyRate || '-'}</span>
          <div className="-ml-[130px]">
            <PreferredCrewSelect
              roleId={roleId}
              preferredId={preferredId}
              onUpdate={handlePreferredChange}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}