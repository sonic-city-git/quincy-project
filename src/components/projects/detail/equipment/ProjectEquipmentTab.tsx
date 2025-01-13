import { Card } from "@/components/ui/card";
import { Box, ListCheck } from "lucide-react";
import { GroupSelector } from "./GroupSelector";
import { useState } from "react";
import { EquipmentSelector } from "./EquipmentSelector";
import { ProjectBaseEquipmentList } from "./ProjectBaseEquipmentList";

interface ProjectEquipmentTabProps {
  projectId: string;
}

export function ProjectEquipmentTab({ projectId }: ProjectEquipmentTabProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  return (
    <div className="h-full">
      <Card className="rounded-lg border-0 bg-zinc-900/50 p-6 h-full">
        <div className="grid grid-cols-1 md:grid-cols-14 gap-6 h-full">
          {/* Available Equipment Column - Spans 5 columns */}
          <div className="md:col-span-5 bg-zinc-800/50 rounded-lg border border-zinc-700/50 transition-colors flex flex-col h-full overflow-hidden">
            <div className="flex-shrink-0 px-4 py-3 border-b border-zinc-700/50">
              <div className="flex items-center justify-between h-9">
                <div className="flex items-center gap-2">
                  <Box className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Available Equipment</h2>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <EquipmentSelector 
                onSelect={() => {}} 
                projectId={projectId}
                selectedGroupId={selectedGroupId}
                className="h-full p-4"
              />
            </div>
          </div>
          
          {/* Project Equipment Column - Spans 9 columns */}
          <div className="md:col-span-9 bg-zinc-800/50 rounded-lg border border-zinc-700/50 transition-colors flex flex-col h-full overflow-hidden">
            <div className="flex-shrink-0 px-4 py-3 border-b border-zinc-700/50">
              <div className="flex items-center justify-between h-9">
                <div className="flex items-center gap-2">
                  <ListCheck className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Project Equipment</h2>
                </div>
                <GroupSelector 
                  projectId={projectId} 
                  selectedGroupId={selectedGroupId}
                  onGroupSelect={setSelectedGroupId}
                />
              </div>
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