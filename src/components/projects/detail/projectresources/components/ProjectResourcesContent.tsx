// Resources Content Component
// Main content area displaying crew roles and equipment for selected variant

import { Suspense } from 'react';
import { Users, Package, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  VariantResourceData, 
  VariantCrewRole, 
  VariantEquipmentGroup,
  VariantEquipmentItem 
} from '@/types/variants';
import { CrewRolesList } from './CrewRolesList';
import { EquipmentSection } from './EquipmentSection';
import { LoadingSpinner } from '@/components/resources/shared/LoadingSpinner';

interface ProjectResourcesContentProps {
  projectId: string;
  variantName: string;
  resourceData: VariantResourceData | null;
  isLoading: boolean;
  expandedGroups: Set<string>;
  onToggleGroup: (groupId: string) => void;
  
  // Crew operations
  onAddCrewRole: (roleData: Omit<VariantCrewRole, 'id' | 'project_id' | 'variant_name'>) => Promise<VariantCrewRole>;
  onUpdateCrewRole: (roleId: string, updates: Partial<VariantCrewRole>) => Promise<VariantCrewRole>;
  onRemoveCrewRole: (roleId: string) => Promise<void>;
  
  // Equipment operations  
  onAddEquipmentItem: (itemData: Omit<VariantEquipmentItem, 'id' | 'project_id' | 'variant_name'>) => Promise<VariantEquipmentItem>;
  onUpdateEquipmentItem: (itemId: string, updates: Partial<VariantEquipmentItem>) => Promise<VariantEquipmentItem>;
  onRemoveEquipmentItem: (itemId: string) => Promise<void>;
  
  // Group operations
  onCreateEquipmentGroup: (groupData: { name: string; sort_order?: number }) => Promise<VariantEquipmentGroup>;
  onUpdateEquipmentGroup: (groupId: string, updates: Partial<VariantEquipmentGroup>) => Promise<VariantEquipmentGroup>;
  onDeleteEquipmentGroup: (groupId: string, moveItemsToGroupId?: string) => Promise<void>;
}

export function ProjectResourcesContent({
  projectId,
  variantName,
  resourceData,
  isLoading,
  expandedGroups,
  onToggleGroup,
  onAddCrewRole,
  onUpdateCrewRole,
  onRemoveCrewRole,
  onAddEquipmentItem,
  onUpdateEquipmentItem,
  onRemoveEquipmentItem,
  onCreateEquipmentGroup,
  onUpdateEquipmentGroup,
  onDeleteEquipmentGroup
}: ProjectResourcesContentProps) {

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingSpinner text="Loading variant resources..." />
      </div>
    );
  }

  if (!resourceData) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No resource data available
      </div>
    );
  }

  const { crew_roles, equipment_groups, equipment_ungrouped } = resourceData;
  
  // Calculate totals
  const totalCrewRoles = crew_roles.length;
  const totalEquipmentItems = equipment_groups.reduce((sum, group) => sum + group.equipment_items.length, 0) + equipment_ungrouped.length;
  const totalGroups = equipment_groups.length;

  return (
    <div className="space-y-8">
      {/* Resource Summary */}
      <div className="flex items-center gap-6 p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-orange-500" />
          <span className="text-sm font-medium">Crew Roles</span>
          <Badge variant="outline" className="ml-1">
            {totalCrewRoles}
          </Badge>
        </div>
        
        <Separator orientation="vertical" className="h-4" />
        
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-green-500" />
          <span className="text-sm font-medium">Equipment Items</span>
          <Badge variant="outline" className="ml-1">
            {totalEquipmentItems}
          </Badge>
        </div>
        
        {totalGroups > 0 && (
          <>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Groups</span>
              <Badge variant="outline" className="ml-1">
                {totalGroups}
              </Badge>
            </div>
          </>
        )}
      </div>

      {/* Crew Roles Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-orange-500" />
            <h3 className="text-lg font-semibold">Crew Roles</h3>
            <Badge variant="outline">{totalCrewRoles}</Badge>
          </div>
          
          <Button size="sm" variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Role
          </Button>
        </div>

        <Suspense fallback={<LoadingSpinner text="Loading crew roles..." />}>
          <CrewRolesList
            projectId={projectId}
            variantName={variantName}
            crewRoles={crew_roles}
            onAddRole={onAddCrewRole}
            onUpdateRole={onUpdateCrewRole}
            onRemoveRole={onRemoveCrewRole}
          />
        </Suspense>
      </div>

      <Separator />

      {/* Equipment Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-green-500" />
            <h3 className="text-lg font-semibold">Equipment</h3>
            <Badge variant="outline">{totalEquipmentItems}</Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Group
            </Button>
            <Button size="sm" variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Equipment
            </Button>
          </div>
        </div>

        <Suspense fallback={<LoadingSpinner text="Loading equipment..." />}>
          <EquipmentSection
            projectId={projectId}
            variantName={variantName}
            equipmentGroups={equipment_groups}
            ungroupedEquipment={equipment_ungrouped}
            expandedGroups={expandedGroups}
            onToggleGroup={onToggleGroup}
            onAddItem={onAddEquipmentItem}
            onUpdateItem={onUpdateEquipmentItem}
            onRemoveItem={onRemoveEquipmentItem}
            onCreateGroup={onCreateEquipmentGroup}
            onUpdateGroup={onUpdateEquipmentGroup}
            onDeleteGroup={onDeleteEquipmentGroup}
          />
        </Suspense>
      </div>

      {/* Empty State */}
      {totalCrewRoles === 0 && totalEquipmentItems === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
          <div className="space-y-3">
            <div className="flex justify-center space-x-2">
              <Users className="h-8 w-8 text-muted-foreground" />
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-muted-foreground">
              No resources configured
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              This variant doesn't have any crew roles or equipment configured yet. 
              Use the buttons above to add crew roles and equipment for this variant.
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <Button size="sm" variant="outline" className="gap-2">
                <Users className="h-4 w-4" />
                Add First Role
              </Button>
              <Button size="sm" variant="outline" className="gap-2">
                <Package className="h-4 w-4" />
                Add First Equipment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}