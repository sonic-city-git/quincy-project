import { Card } from "@/components/ui/card";
import { ProjectBaseEquipmentList } from "./ProjectBaseEquipmentList";

interface ProjectEquipmentTabProps {
  projectId: string;
}

export function ProjectEquipmentTab({ projectId }: ProjectEquipmentTabProps) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <ProjectBaseEquipmentList projectId={projectId} />
      </Card>
    </div>
  );
}