import { Card } from "@/components/ui/card";
import { ProjectEquipmentList } from "./ProjectEquipmentList";
import { EquipmentSelector } from "./EquipmentSelector";
import { useProjectEquipment } from "@/hooks/useProjectEquipment";

interface ProjectEquipmentTabProps {
  projectId: string;
}

export function ProjectEquipmentTab({ projectId }: ProjectEquipmentTabProps) {
  const { equipment, loading, addEquipment, removeEquipment } = useProjectEquipment(projectId);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-start gap-6">
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-4">Project Equipment</h2>
            <ProjectEquipmentList 
              equipment={equipment} 
              loading={loading}
              onRemove={removeEquipment}
            />
          </div>
          <div className="w-[300px]">
            <EquipmentSelector onSelect={addEquipment} />
          </div>
        </div>
      </Card>
    </div>
  );
}