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

  // NOTE: This component is now replaced by the new VariantsContent layout
  // Keeping this component for backward compatibility but it's no longer used
  // The new layout splits Available Resources (left panel) from Variant Content (right panel)
  
  return (
    <div className="p-4 bg-muted/50 border border-border rounded-lg">
      <p className="text-sm text-muted-foreground text-center">
        ⚠️ This component has been replaced by the new layout design.
        <br />
        Equipment management is now handled in the VariantsContent component.
      </p>
    </div>
  );
}