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
    <div className="space-y-8">
      <Card className="rounded-lg bg-zinc-800/45 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Available Equipment Column */}
          <Card className="rounded-lg bg-zinc-800/45">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Box className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Available Equipment</h2>
              </div>
              <div className="h-[600px]">
                <EquipmentSelector 
                  onSelect={() => {}} 
                  projectId={projectId}
                  selectedGroupId={selectedGroupId}
                />
              </div>
            </div>
          </Card>
          
          {/* Project Equipment Column */}
          <Card className="rounded-lg bg-zinc-800/45">
            <div className="p-6">
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
              <div className="h-[600px]">
                <ProjectBaseEquipmentList 
                  projectId={projectId} 
                  selectedGroupId={selectedGroupId}
                  onGroupSelect={setSelectedGroupId}
                />
              </div>
            </div>
          </Card>
        </div>
      </Card>
    </div>
  );
}