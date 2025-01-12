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
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-220px)]">
          {/* Available Equipment Column - 1/3 width */}
          <div className="col-span-4 flex flex-col border-r border-border pr-4 h-full overflow-hidden">
            <div className="flex items-center gap-2 mb-4 pl-2">
              <Box className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Available Equipment</h2>
            </div>
            <div className="flex-1 overflow-auto">
              <EquipmentSelector 
                onSelect={() => {}} 
                projectId={projectId}
                selectedGroupId={selectedGroupId}
              />
            </div>
          </div>

          <div className="col-span-8 flex flex-col pl-6 h-full overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <ListCheck className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Project Equipment</h2>
            </div>
            <GroupSelector 
              projectId={projectId} 
              selectedGroupId={selectedGroupId}
              onGroupSelect={setSelectedGroupId}
            />
            <div className="flex-1 overflow-auto mt-4">
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