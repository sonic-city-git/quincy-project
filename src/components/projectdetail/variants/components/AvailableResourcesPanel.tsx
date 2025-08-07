/**
 * 🎯 STOCK EQUIPMENT PANEL - LEFT SIDEBAR
 * 
 * ✅ Shows available stock equipment to add to variants
 * ✅ Design system compliant with StatusCard patterns
 * ✅ Simple equipment selection interface
 */

import { Box } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { STATUS_COLORS } from '@/components/dashboard/shared/StatusCard';
import { COMPONENT_CLASSES, cn } from '@/design-system';
import { EquipmentSelector } from '../equipment/components/EquipmentSelector';
import { Equipment } from '@/types/equipment';

interface AvailableResourcesPanelProps {
  projectId: string;
  selectedVariant: string;
  selectedGroupId: string | null;
  hasGroups: boolean;
  onEquipmentAdd: (equipment: Equipment) => Promise<void>;
}

export function AvailableResourcesPanel({ 
  projectId, 
  selectedVariant,
  selectedGroupId,
  hasGroups,
  onEquipmentAdd
}: AvailableResourcesPanelProps) {
  const infoColors = STATUS_COLORS.info;

  return (
    <Card className={cn(
      'overflow-hidden h-full',
      'bg-gradient-to-br', infoColors.bg,
      'border', infoColors.border,
      'shadow-sm hover:shadow-md transition-shadow duration-200'
    )}>
      {/* Header */}
      <div className={cn(
        'border-b border-border/50 bg-background/20 backdrop-blur-sm',
        COMPONENT_CLASSES.card.default.includes('p-') ? '' : 'px-4 py-3'
      )}>
        <div className="flex items-center gap-2 mb-1">
          <Box className={cn('h-5 w-5', infoColors.text)} />
          <h2 className="font-semibold text-lg">Stock Equipment</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Add equipment to your variant
        </p>
      </div>

      {/* Content */}
      <CardContent className="p-0 h-[calc(100%-81px)] overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Group Selection Status */}
          <div className={cn(
            'px-4 py-3 border-b border-border/50 bg-background/10'
          )}>
            {selectedGroupId ? (
              <div className="space-y-1">
                <p className="text-xs font-medium text-primary">
                  Adding to selected group
                </p>
                <p className="text-xs text-muted-foreground">
                  Double-click equipment to add to group, or drag & drop to variant list
                </p>
              </div>
            ) : !hasGroups ? (
              <div className="space-y-1">
                <p className={cn('text-xs font-medium', STATUS_COLORS.warning.text)}>
                  No groups in variant
                </p>
                <p className="text-xs text-muted-foreground">
                  Double-click equipment to create your first group, or drag to variant area
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  No group selected
                </p>
                <p className="text-xs text-muted-foreground">
                  Select a group in the variant list, then double-click to add equipment
                </p>
              </div>
            )}
          </div>
          
          {/* Equipment Selector */}
          <div className="flex-1 overflow-hidden">
            <EquipmentSelector 
              onSelect={onEquipmentAdd}
              projectId={projectId}
              selectedGroupId={selectedGroupId}
              className="h-full"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}