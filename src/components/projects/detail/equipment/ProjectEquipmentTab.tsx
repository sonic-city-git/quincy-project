import { Card } from "@/components/ui/card";
import { Box, ListCheck } from "lucide-react";
import { GroupSelector } from "./GroupSelector";
import { useState } from "react";
import { EquipmentSelector } from "./EquipmentSelector";
import { ProjectBaseEquipmentList } from "./ProjectBaseEquipmentList";
import { Equipment } from "@/types/equipment";
import { useProjectEquipment } from "@/hooks/useProjectEquipment";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/utils/priceFormatters";

interface ProjectEquipmentTabProps {
  projectId: string;
}

export function ProjectEquipmentTab({ projectId }: ProjectEquipmentTabProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const { equipment, addEquipment } = useProjectEquipment(projectId);

  // Calculate total price across all equipment
  const totalPrice = equipment?.reduce((total, item) => {
    return total + (item.rental_price || 0) * item.quantity;
  }, 0) || 0;

  const handleEquipmentSelect = async (equipment: Equipment) => {
    if (!selectedGroupId) {
      toast.error('Please select a group first');
      return;
    }

    try {
      await addEquipment(equipment, selectedGroupId);
      toast.success('Equipment added to project');
    } catch (error) {
      console.error('Error adding equipment:', error);
      toast.error('Failed to add equipment');
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1">
        <div className="grid grid-cols-1 md:grid-cols-14 gap-6 h-[calc(100vh-12rem)]">
          {/* Available Equipment Column */}
          <Card className="md:col-span-6 bg-zinc-800/45 rounded-lg border border-zinc-700/50 transition-colors flex flex-col h-full overflow-hidden">
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
                onSelect={handleEquipmentSelect} 
                projectId={projectId}
                selectedGroupId={selectedGroupId}
                className="h-full"
              />
            </div>
          </Card>
          
          {/* Project Equipment Column */}
          <Card className="md:col-span-8 bg-zinc-800/45 rounded-lg border border-zinc-700/50 transition-colors flex flex-col h-full overflow-hidden">
            <div className="flex-shrink-0 px-4 py-3 border-b border-zinc-700/50">
              <div className="flex items-center justify-between h-9">
                <div className="flex items-center gap-2">
                  <ListCheck className="h-5 w-5 text-primary" />
                  <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold">Project Equipment</h2>
                    <span className="text-sm text-muted-foreground">
                      Total: {formatPrice(totalPrice)}
                    </span>
                  </div>
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
          </Card>
        </div>
      </div>
    </div>
  );
}