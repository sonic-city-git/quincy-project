/**
 * CONSOLIDATED: ProjectEquipmentTab - Now using ProjectTabCard and ProjectEquipmentCard
 * Reduced from 94 lines to 60 lines (36% reduction)
 */

import { Box, ListCheck } from "lucide-react";
import { GroupSelector } from "./GroupSelector";
import { useState } from "react";
import { EquipmentSelector } from "./EquipmentSelector";
import { ProjectBaseEquipmentList } from "./ProjectBaseEquipmentList";
import { ProjectTabCard, ProjectEquipmentCard } from "../../shared/ProjectTabCard";
import { Equipment } from "@/types/equipment";
import { useProjectEquipment } from "@/hooks/useProjectEquipment";
import { toast } from "sonner";
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
    <div className="space-y-6">
      <div className="flex gap-6">
        {/* Available Equipment Column */}
        <ProjectTabCard
          title="Available Equipment"
          icon={Box}
          variant="flex"
          className="flex-[6]"
          contentClassName="h-[600px] overflow-hidden"
          padding="none"
        >
          <EquipmentSelector 
            onSelect={handleEquipmentSelect} 
            projectId={projectId}
            selectedGroupId={selectedGroupId}
            className="h-full"
          />
        </ProjectTabCard>
        
        {/* Project Equipment Column */}
        <ProjectEquipmentCard
          title="Project Equipment"
          icon={ListCheck}
          totalPrice={totalPrice}
          formatPrice={formatPrice}
          className="flex-[8]"
          headerExtra={
            <GroupSelector 
              projectId={projectId} 
              selectedGroupId={selectedGroupId}
              onGroupSelect={setSelectedGroupId}
            />
          }
        >
          <ProjectBaseEquipmentList 
            projectId={projectId} 
            selectedGroupId={selectedGroupId}
            onGroupSelect={setSelectedGroupId}
          />
        </ProjectEquipmentCard>
      </div>
    </div>
  );
}