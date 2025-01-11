import { Card } from "@/components/ui/card";
import { ProjectBaseEquipmentList } from "./ProjectBaseEquipmentList";
import { EquipmentSelector } from "./EquipmentSelector";
import { Box, ListCheck } from "lucide-react";

interface ProjectEquipmentTabProps {
  projectId: string;
}

export function ProjectEquipmentTab({ projectId }: ProjectEquipmentTabProps) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="grid grid-cols-2 gap-6">
          {/* Available Equipment Column */}
          <div className="flex flex-col h-[700px]">
            <div className="flex items-center gap-2 mb-4">
              <Box className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Available Equipment</h2>
            </div>
            <div className="flex-1 overflow-hidden">
              <EquipmentSelector onSelect={() => {}} />
            </div>
          </div>

          {/* Project Equipment List Column */}
          <div className="flex flex-col h-[700px]">
            <div className="flex items-center gap-2 mb-4">
              <ListCheck className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Project Equipment</h2>
            </div>
            <div className="flex-1 overflow-hidden">
              <ProjectBaseEquipmentList projectId={projectId} />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}