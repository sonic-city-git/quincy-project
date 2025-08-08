/**
 * 🎯 VARIANT EQUIPMENT LIST - SIMPLIFIED FOR NEW LAYOUT
 * 
 * ✅ Shows only the variant's assigned equipment
 * ✅ Design system compliant
 * ✅ Compact view for right panel
 */

import { Package } from 'lucide-react';
import { useVariantEquipment } from '@/hooks/useVariantEquipment';
import { BaseEquipmentList } from './BaseEquipmentList';

interface VariantEquipmentListProps {
  projectId: string;
  variantId: string;
  variantName: string;
  selectedGroupId: string | null;
  onGroupSelect: (groupId: string | null) => void;
  scrollToItemId?: string;
}

export function VariantEquipmentList({ 
  projectId,
  variantId,
  variantName,
  selectedGroupId,
  onGroupSelect,
  scrollToItemId
}: VariantEquipmentListProps) {
  const { 
    equipmentData, 
    isLoading, 
    error 
  } = useVariantEquipment(projectId, variantId);

  // Note: Group management is handled by BaseEquipmentList through useVariantEquipment hook

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="animate-pulse space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-muted/50 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <Package className="h-8 w-8 mx-auto mb-2 text-destructive" />
        <p className="text-sm text-destructive">Failed to load equipment</p>
      </div>
    );
  }

  return (
    <div>
      {/* Equipment Content - Always show BaseEquipmentList for drag & drop */}
      <div className="space-y-1.5">
        <BaseEquipmentList 
          projectId={projectId}
          variantId={variantId}
          variantName={variantName}
          selectedGroupId={selectedGroupId}
          onGroupSelect={onGroupSelect}
          equipmentGroups={equipmentData?.equipment_groups || []}
          ungroupedEquipment={equipmentData?.equipment_ungrouped || []}
          isLoading={isLoading}
          compact={true}
          scrollToItemId={scrollToItemId}
        />
      </div>
    </div>
  );
}