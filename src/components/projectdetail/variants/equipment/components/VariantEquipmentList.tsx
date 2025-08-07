/**
 * 🎯 VARIANT EQUIPMENT LIST - SIMPLIFIED FOR NEW LAYOUT
 * 
 * ✅ Shows only the variant's assigned equipment
 * ✅ Design system compliant
 * ✅ Compact view for right panel
 */

import { useState } from 'react';
import { Copy, DollarSign, Package, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useVariantResources } from '@/hooks/useVariantResources';
import { formatPrice } from '@/utils/priceFormatters';
import { copyEquipmentBetweenVariants } from '@/utils/variantEquipmentCopy';
import { toast } from 'sonner';
import { STATUS_COLORS } from '@/components/dashboard/shared/StatusCard';
import { BaseEquipmentList } from './BaseEquipmentList';
import { useGroupManagement } from '../hooks/useGroupManagement';

interface VariantEquipmentListProps {
  projectId: string;
  variantName: string;
  selectedGroupId: string | null;
  onGroupSelect: (groupId: string | null) => void;
}

export function VariantEquipmentList({ 
  projectId, 
  variantName,
  selectedGroupId,
  onGroupSelect
}: VariantEquipmentListProps) {
  const { 
    resourceData, 
    isLoading, 
    error 
  } = useVariantResources(projectId, variantName);

  // Note: Group management is handled by BaseEquipmentList through useGroupManagement hook

  const successColors = STATUS_COLORS.success;
  const warningColors = STATUS_COLORS.warning;

  // Calculate total price
  const totalPrice = resourceData ? (
    [...resourceData.equipment_groups, { equipment_items: resourceData.equipment_ungrouped }]
      .reduce((total, group) => {
        return total + group.equipment_items.reduce((groupTotal, item) => {
          return groupTotal + (item.equipment?.rental_price || 0) * item.quantity;
        }, 0);
      }, 0)
  ) : 0;

  const hasEquipment = resourceData && (
    resourceData.equipment_groups.length > 0 || 
    resourceData.equipment_ungrouped.length > 0
  );

  const handleCopyFromDefault = async () => {
    if (variantName === 'default') {
      toast.error('Cannot copy to default variant');
      return;
    }

    try {
      const result = await copyEquipmentBetweenVariants(projectId, 'default', variantName);
      
      if (result.success) {
        toast.success(`Copied ${result.copiedCount} equipment items from default variant`);
        window.location.reload(); // Simple refresh for now
      } else {
        toast.error(result.error || 'Failed to copy equipment');
      }
    } catch (error) {
      console.error('Error copying equipment:', error);
      toast.error('Failed to copy equipment from default variant');
    }
  };

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
    <div className="space-y-4">
      {/* Variant Stats Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className={`h-4 w-4 ${successColors.text}`} />
            <span className="text-sm font-medium">Total Value</span>
          </div>
          <Badge variant="outline" className={`${successColors.text} ${successColors.border}`}>
            {formatPrice(totalPrice)}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className={`h-4 w-4 ${STATUS_COLORS.info.text}`} />
            <span className="text-sm font-medium">Items</span>
          </div>
          <Badge variant="outline">
            {(resourceData?.equipment_groups || []).reduce((total, group) => 
              total + group.equipment_items.length, 0
            ) + (resourceData?.equipment_ungrouped || []).length}
          </Badge>
        </div>
      </div>

      {/* Actions */}
      {variantName !== 'default' && !hasEquipment && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyFromDefault}
            className="gap-1.5 w-full"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy from Default
          </Button>
        </div>
      )}

      {/* Equipment Content - Always show BaseEquipmentList for drag & drop */}
      <div className="space-y-4">
        <BaseEquipmentList 
          projectId={projectId} 
          variantName={variantName}
          selectedGroupId={selectedGroupId}
          onGroupSelect={onGroupSelect}
          equipmentGroups={resourceData?.equipment_groups || []}
          ungroupedEquipment={resourceData?.equipment_ungrouped || []}
          isLoading={isLoading}
          compact={true}
        />
      </div>
    </div>
  );
}