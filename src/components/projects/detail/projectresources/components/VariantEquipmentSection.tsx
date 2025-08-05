/**
 * Variant Equipment Section - Copy of original ProjectEquipmentTab with variant support
 */

import { Box, ListCheck } from "lucide-react";
import { GroupSelector } from "../../equipment/GroupSelector";
import { useState } from "react";
import { EquipmentSelector } from "../../equipment/EquipmentSelector";
import { ProjectBaseEquipmentList } from "../../equipment/ProjectBaseEquipmentList";
import { ProjectTabCard, ProjectEquipmentCard } from "../../../shared/ProjectTabCard";
import { Equipment } from "@/types/equipment";
import { useProjectEquipment } from "@/hooks/useProjectEquipment";
import { toast } from "sonner";
import { formatPrice } from "@/utils/priceFormatters";

interface VariantEquipmentSectionProps {
  projectId: string;
  variantName: string;
}

export function VariantEquipmentSection({ projectId, variantName }: VariantEquipmentSectionProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const { equipment, addEquipment } = useProjectEquipment(projectId);

  // Calculate total price across all equipment for this variant
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
  );
}