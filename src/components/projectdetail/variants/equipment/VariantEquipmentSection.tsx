/**
 * Variant Equipment Section - Copy of original ProjectEquipmentTab with variant support
 */

import { Box, ListCheck } from "lucide-react";
import { GroupSelector } from "./components/GroupSelector";
import { useState } from "react";
import { EquipmentSelector } from "./components/EquipmentSelector";
import { BaseEquipmentList } from "./components/BaseEquipmentList";
import { ProjectTabCard, ProjectEquipmentCard } from "../../shared/ProjectTabCard";
import { Equipment } from "@/types/equipment";
import { useVariantResources } from "@/hooks/useVariantResources";
import { toast } from "sonner";
import { formatPrice } from "@/utils/priceFormatters";
import { copyEquipmentBetweenVariants } from "@/utils/variantEquipmentCopy";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";

interface VariantEquipmentSectionProps {
  projectId: string;
  variantName: string;
}

export function VariantEquipmentSection({ projectId, variantName }: VariantEquipmentSectionProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const { 
    resourceData, 
    isLoading, 
    error,
    addEquipmentItem 
  } = useVariantResources(projectId, variantName);

  // Calculate total price across all equipment for this variant
  const totalPrice = resourceData ? (
    [...resourceData.equipment_groups, { equipment_items: resourceData.equipment_ungrouped }]
      .reduce((total, group) => {
        return total + group.equipment_items.reduce((groupTotal, item) => {
          return groupTotal + (item.equipment?.rental_price || 0) * item.quantity;
        }, 0);
      }, 0)
  ) : 0;

  const handleEquipmentSelect = async (equipment: Equipment) => {
    if (!selectedGroupId) {
      toast.error('Please select a group first');
      return;
    }

    try {
      await addEquipmentItem({
        equipment_id: equipment.id,
        group_id: selectedGroupId,
        quantity: 1,
        notes: ''
      });
      toast.success('Equipment added to variant');
    } catch (error) {
      console.error('Error adding equipment:', error);
      toast.error('Failed to add equipment');
    }
  };

  const handleCopyFromDefault = async () => {
    if (variantName === 'default') {
      toast.error('Cannot copy to default variant');
      return;
    }

    try {
      const result = await copyEquipmentBetweenVariants(projectId, 'default', variantName);
      
      if (result.success) {
        toast.success(`Copied ${result.copiedCount} equipment items from default variant`);
        // Refresh the variant resources
        window.location.reload(); // Simple refresh for now
      } else {
        toast.error(result.error || 'Failed to copy equipment');
      }
    } catch (error) {
      console.error('Error copying equipment:', error);
      toast.error('Failed to copy equipment from default variant');
    }
  };

  return (
    <div className="flex gap-4">
      {/* Available Equipment Column */}
      <ProjectTabCard
        title="Available Equipment"
        icon={Box}
        variant="flex"
        className="flex-[6]"
        contentClassName="h-[500px] overflow-hidden"
        padding="compact"
      >
        <EquipmentSelector 
          onSelect={handleEquipmentSelect} 
          projectId={projectId}
          selectedGroupId={selectedGroupId}
          className="h-full"
        />
      </ProjectTabCard>
      
      {/* Variant Equipment Column */}
      <ProjectEquipmentCard
        title="Variant Equipment"
        icon={ListCheck}
        totalPrice={totalPrice}
        formatPrice={formatPrice}
        className="flex-[8]"
        padding="compact"
        headerExtra={
          <div className="flex items-center gap-2">
            {/* Show copy button if this variant is empty and we're not on default */}
            {variantName !== 'default' && 
             resourceData && 
             resourceData.equipment_groups.length === 0 && 
             resourceData.equipment_ungrouped.length === 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyFromDefault}
                className="flex items-center gap-1"
              >
                <Copy className="h-3 w-3" />
                Copy from Default
              </Button>
            )}
            <GroupSelector 
              projectId={projectId} 
              variantName={variantName}
              selectedGroupId={selectedGroupId}
              onGroupSelect={setSelectedGroupId}
            />
          </div>
        }
      >
        <BaseEquipmentList 
          projectId={projectId} 
          variantName={variantName}
          selectedGroupId={selectedGroupId}
          onGroupSelect={setSelectedGroupId}
          equipmentGroups={resourceData?.equipment_groups || []}
          ungroupedEquipment={resourceData?.equipment_ungrouped || []}
          isLoading={isLoading}
        />
      </ProjectEquipmentCard>
    </div>
  );
}