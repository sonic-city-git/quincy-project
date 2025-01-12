import { Card } from "@/components/ui/card";
import { ProjectBaseEquipmentList } from "./ProjectBaseEquipmentList";
import { EquipmentSelector } from "./EquipmentSelector";
import { Box, ListCheck } from "lucide-react";
import { GroupSelector } from "./GroupSelector";
import { useState } from "react";

interface ProjectEquipmentTabProps {
  projectId: string;
}

export function ProjectEquipmentTab({ projectId }: ProjectEquipmentTabProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Available Equipment Column - 1/3 width */}
          <div className="col-span-4 border-r border-zinc-800 pr-6 h-[700px] overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <Box className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Available Equipment</h2>
            </div>
            <div className="flex-1 overflow-hidden">
              <EquipmentSelector 
                onSelect={() => {}} 
                projectId={projectId}
                selectedGroupId={selectedGroupId}
              />
            </div>
          </div>

          {/* Project Equipment List Column - 2/3 width */}
          <div className="col-span-8 h-[700px] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ListCheck className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Project Equipment</h2>
              </div>
              <GroupSelector 
                projectId={projectId} 
                selectedGroupId={selectedGroupId}
                onGroupSelect={setSelectedGroupId}
              />
            </div>
            <div className="flex-1 overflow-hidden">
              <ProjectBaseEquipmentList 
                projectId={projectId} 
                selectedGroupId={selectedGroupId}
                onGroupSelect={setSelectedGroupId}
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}