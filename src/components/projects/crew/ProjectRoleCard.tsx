import { Card } from "@/components/ui/card";
import { RoleInfo } from "./RoleInfo";

interface ProjectRoleCardProps {
  id: string;
  projectId: string;
  name: string;
  color: string;
  dailyRate?: number | null;
  hourlyRate?: number | null;
  onUpdate?: () => void;
}

export function ProjectRoleCard({ 
  id,
  projectId,
  name, 
  color, 
  dailyRate,
  hourlyRate,
  onUpdate
}: ProjectRoleCardProps) {
  return (
    <Card className="p-2">
      <div className="flex items-center gap-6">
        <RoleInfo color={color} name={name} />
        <div className="flex items-center gap-6">
          <span className="w-24 text-sm">{dailyRate || '-'}</span>
          <span className="w-24 text-sm">{hourlyRate || '-'}</span>
        </div>
      </div>
    </Card>
  );
}