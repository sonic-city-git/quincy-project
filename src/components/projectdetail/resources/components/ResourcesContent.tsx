/**
 * 🎨 REDESIGNED VARIANTS CONTENT - DESIGN SYSTEM COMPLIANT
 * 
 * ✅ NEW LAYOUT: Available Resources (left) | Variant Content (right with tabs)
 * ✅ StatusCard-based design patterns from dashboard reference
 * ✅ Clear visual hierarchy and ownership relationships
 * ✅ Design system color consistency
 */

import { useState, useEffect } from 'react';
import { Settings, Plus, Box, Users, Layers, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ProjectVariant } from '@/types/variants';
import { LoadingSpinner } from '@/components/resources/shared/LoadingSpinner';
import { cn } from '@/lib/utils';
import { STATUS_COLORS } from '@/components/dashboard/shared/StatusCard';
import { COMPONENT_CLASSES, RESPONSIVE } from '@/design-system';
import { VariantEquipmentList } from '../equipment/components/VariantEquipmentList';
import { VariantCrewList } from '../crew/components/VariantCrewList';
import { AvailableResourcesPanel } from './AvailableResourcesPanel';
import { useVariantEquipment } from '@/hooks/variant';
import { useVariantCrew } from '@/hooks/variant';
import { useProjectDetails } from '@/hooks/project';
import { Equipment } from '@/types/equipment';
import { toast } from 'sonner';
import { copyEquipmentBetweenVariants } from '@/utils/variantEquipmentCopy';
import { AddRoleDialog } from '../crew/components/AddRoleDialog';
import { GroupDialogs } from '../equipment/components/GroupDialogs';

// Equipment Section Button Component
function EquipmentSectionButton({ 
  projectId, 
  variantId, 
  variantName,
  onAddGroup 
}: { 
  projectId: string; 
  variantId: string;
  variantName: string;
  onAddGroup: () => void;
}) {
  const { equipmentData } = useVariantEquipment(projectId, variantId);
  
  const hasEquipment = equipmentData && (
    equipmentData.equipment_groups.length > 0 || 
    equipmentData.equipment_ungrouped.length > 0
  );

  const handleCopyFromDefault = async () => {
    if (variantName === 'default') {
      toast.error('Cannot copy from default to itself');
      return;
    }

    try {
      await copyEquipmentBetweenVariants(projectId, 'default', variantName);
      toast.success('Equipment copied successfully');
    } catch (error) {
      console.error('Error copying equipment:', error);
      toast.error('Failed to copy equipment');
    }
  };

  if (hasEquipment) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onAddGroup}
        className="gap-1.5 h-7 text-xs"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Group
      </Button>
    );
  }

  if (variantName !== 'default') {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopyFromDefault}
        className="gap-1.5 h-7 text-xs"
      >
        <Copy className="h-3.5 w-3.5" />
        Copy from Default
      </Button>
    );
  }

  return null;
}

// Crew Section Button Component
function CrewSectionButton({ 
  projectId, 
  variantId,
  variantName 
}: { 
  projectId: string; 
  variantId: string;
  variantName: string;
}) {
  const [isAddRoleDialogOpen, setIsAddRoleDialogOpen] = useState(false);
  const { project } = useProjectDetails(projectId);
  const { crewRoles } = useVariantCrew(projectId, variantId);

  const totalRoles = crewRoles?.length || 0;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsAddRoleDialogOpen(true)}
        className="gap-1.5 h-7 text-xs"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Role
      </Button>

      {project && (
        <AddRoleDialog
          isOpen={isAddRoleDialogOpen}
          onClose={() => setIsAddRoleDialogOpen(false)}
          project={project}
          variantId={variantId}
          variantName={variantName}
        />
      )}
    </>
  );
}

interface ResourcesContentProps {
  projectId: string;
  variants: ProjectVariant[];
  selectedVariant: string;
  selectedVariantObject: ProjectVariant | undefined;
  onVariantSelect: (variantName: string) => void;
  isLoading: boolean;
  onEditVariant?: (variant: ProjectVariant) => void;
  onCreateVariant?: () => void;
}

export function ResourcesContent({
  projectId,
  variants,
  selectedVariant,
  selectedVariantObject,
  onVariantSelect,
  isLoading,
  onEditVariant,
  onCreateVariant
}: ResourcesContentProps) {
  // Track selected group for adding equipment
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [scrollToItemId, setScrollToItemId] = useState<string | null>(null);

  // Variant resources management for equipment addition
  const { 
    addEquipmentItem, 
    updateEquipmentItem, 
    equipmentData,
    setShowNewGroupDialog,
    handleCreateGroup,
    showNewGroupDialog,
    newGroupName,
    setNewGroupName
  } = useVariantEquipment(projectId, selectedVariant);

  // State for pending equipment to add after group creation
  const [pendingEquipmentForGroup, setPendingEquipmentForGroup] = useState<Equipment | null>(null);

  // Reset selected group when variant changes
  useEffect(() => {
    setSelectedGroupId(null);
    setPendingEquipmentForGroup(null);
  }, [selectedVariant]);

  // Check if variant has any groups (not counting ungrouped items)
  const hasGroups = equipmentData && equipmentData.equipment_groups.length > 0;

  // Handle creating group with pending equipment
  const handleCreateGroupWithEquipment = async () => {
    if (!pendingEquipmentForGroup) return;
    
    try {
      const newGroup = await handleCreateGroup();
      if (newGroup) {
        // Add the pending equipment to the new group
        await addEquipmentItem({
          equipment_id: pendingEquipmentForGroup.id,
          group_id: newGroup.id,
          quantity: 1,
          notes: '',
          _equipmentInfo: {
            name: pendingEquipmentForGroup.name,
            rental_price: pendingEquipmentForGroup.rental_price || null,
            code: pendingEquipmentForGroup.code || null,
            folder_id: pendingEquipmentForGroup.folder_id || null
          }
        });
        
        // Auto-select the newly created group
        setSelectedGroupId(newGroup.id);
        
        // Scroll to the newly created group (with slight delay to ensure DOM update)
        setTimeout(() => {
          setScrollToItemId(newGroup.id);
          setTimeout(() => setScrollToItemId(null), 1000);
        }, 100);
        
        toast.success(`Created group "${newGroup.name}" and added ${pendingEquipmentForGroup.name}`);
        setPendingEquipmentForGroup(null);
      }
    } catch (error) {
      console.error('Error creating group with equipment:', error);
      toast.error('Failed to create group with equipment');
    }
  };

  // Get selected group name
  const selectedGroupName = selectedGroupId 
    ? equipmentData?.equipment_groups.find(group => group.id === selectedGroupId)?.name || null
    : null;

  // Handle equipment addition from stock equipment panel
  const handleEquipmentAdd = async (equipment: Equipment) => {
    // Guard: No variant selected
    if (!selectedVariant || selectedVariant.trim() === '') {
      toast.error('No variant selected', {
        description: 'Please select a variant first before adding equipment',
        duration: 4000
      });
      return;
    }

    if (!selectedGroupId) {
      if (!hasGroups) {
        // No groups exist - trigger group creation with this equipment
        setPendingEquipmentForGroup(equipment);
        setShowNewGroupDialog(true);
        return;
      } else {
        toast.error('Please select a group first');
        return;
      }
    }

    try {
      // Add equipment - server will handle duplicates automatically
      const result = await addEquipmentItem({
        equipment_id: equipment.id,
        group_id: selectedGroupId,
        quantity: 1,
        notes: '',
        // Pass equipment info for optimistic update
        _equipmentInfo: {
          name: equipment.name,
          rental_price: equipment.rental_price || null,
          code: equipment.code || null,
          folder_id: equipment.folder_id || null
        }
      });
      
      // Show appropriate success message based on what happened
      if (result._wasOrphaned) {
        toast.success(`Fixed orphaned ${equipment.name} and updated quantity to ${result.quantity}`);
      } else if (result._wasUpdated) {
        toast.success(`Increased ${equipment.name} quantity to ${result.quantity}`);
      } else {
        toast.success(`Added ${equipment.name} to variant`);
      }
      
      // Scroll to the added/updated item
      if (result.id) {
        setScrollToItemId(result.id);
        // Clear scroll target after a delay
        setTimeout(() => setScrollToItemId(null), 1000);
      }
    } catch (error) {
      console.error('Error adding equipment:', error);
      toast.error('Failed to add equipment');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingSpinner text="Loading variants..." />
      </div>
    );
  }

  // Handle empty variants case
  if (variants.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px] h-full">
        <div className="text-center max-w-md">
          <Layers className={cn('h-16 w-16 mx-auto mb-4', STATUS_COLORS.operational.text)} />
          <h3 className="text-xl font-semibold mb-3">No variants found</h3>
          <p className="text-muted-foreground mb-6">
            This project doesn't have any variants yet. Create your first variant to start organizing equipment and crew.
          </p>
          {onCreateVariant && (
            <Button onClick={onCreateVariant} className="gap-2">
              <Plus className="h-4 w-4" />
              Create First Variant
            </Button>
          )}
        </div>
      </div>
    );
  }

  const currentVariant = variants.find(v => v.variant_name === selectedVariant);
  const operationalColors = STATUS_COLORS.operational;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-4 h-[calc(100vh-150px)] min-h-[650px] max-h-[950px]">
      {/* 🎯 LEFT: Available Resources Panel */}
      <AvailableResourcesPanel 
        projectId={projectId} 
        selectedVariant={selectedVariant}
        selectedGroupId={selectedGroupId}
        selectedGroupName={selectedGroupName}
        hasGroups={!!hasGroups}
        onEquipmentAdd={handleEquipmentAdd}
      />

      {/* 🎯 RIGHT: Variant Content Area with Header Tabs */}
      <div className="flex flex-col h-full">
        {/* Variant Content Header */}
        <div className={cn(COMPONENT_CLASSES.card.default, "mb-4 p-4")}>
          <div className={RESPONSIVE.flex.header}>
            {/* Title Section */}
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-lg text-foreground">Variants</h2>
            </div>
            
            {/* Action Section: Add Button + Variant Tabs */}
            <div className="flex items-center gap-3">
              {/* Add New Variant Button - Left of variants */}
              {onCreateVariant && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCreateVariant}
                  className="p-1.5 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                  title="Add new variant"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              )}
              
              {/* Variant Selector Tabs - Sorted right to left */}
              <div className="flex items-center gap-1">
                {[...variants].reverse().map((variant) => (
                  <div key={variant.id} className="relative">
                    <button
                      onClick={() => onVariantSelect(variant.variant_name)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 pr-7 text-sm font-medium rounded-md transition-all duration-200 border",
                        selectedVariant === variant.variant_name
                          ? "bg-primary text-primary-foreground shadow-sm border-primary"
                          : "bg-muted text-foreground hover:bg-muted/80 border-border hover:border-border/80 shadow-sm"
                      )}
                    >
                      <span>{variant.variant_name}</span>
                    </button>
                    {onEditVariant && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditVariant(variant);
                        }}
                        className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded opacity-60 hover:opacity-100 z-10 transition-opacity"
                      >
                        <Settings className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Variant Content Card */}
        <Card className={`
          flex-1 bg-gradient-to-br ${operationalColors.bg} 
          border ${operationalColors.border} 
          overflow-hidden
          shadow-sm hover:shadow-md transition-shadow
        `}>
          <CardContent className="p-0 h-full overflow-hidden">
            {currentVariant ? (
              <div className="h-full flex flex-col">
                {/* Variant Resources Grid */}
                <div className="flex-1 grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-0 min-h-0">
                  {/* Equipment Section */}
                  <div className="xl:border-r border-border/50 bg-card/50 flex flex-col min-h-0">
                    <div className="px-4 py-3 border-b border-border/50 bg-background/10 flex-shrink-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Box className={cn('h-4 w-4', STATUS_COLORS.info.text)} />
                          <h3 className="font-medium text-sm">Equipment</h3>
                        </div>
                        <EquipmentSectionButton 
                          projectId={projectId}
                          variantId={selectedVariantObject?.id || ''}
                          variantName={selectedVariant}
                          onAddGroup={() => setShowNewGroupDialog(true)}
                        />
                      </div>
                    </div>
                    <div className="flex-1 min-h-0 relative">
                      <div className="absolute inset-0 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                        <div className="p-4">
                          <VariantEquipmentList 
                            projectId={projectId}
                            variantId={selectedVariantObject?.id || ''}
                            variantName={selectedVariant}
                            selectedGroupId={selectedGroupId}
                            onGroupSelect={setSelectedGroupId}
                            scrollToItemId={scrollToItemId}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Crew Section */}
                  <div className="bg-card/30 flex flex-col xl:border-t-0 border-t border-border/50 xl:mt-0 mt-4 min-h-0">
                    <div className="px-4 py-3 border-b border-border/50 bg-background/10 flex-shrink-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className={cn('h-4 w-4', STATUS_COLORS.success.text)} />
                          <h3 className="font-medium text-sm">Crew Roles</h3>
                        </div>
                        <CrewSectionButton 
                          projectId={projectId}
                          variantId={selectedVariantObject?.id || ''}
                          variantName={selectedVariant}
                        />
                      </div>
                    </div>
                    <div className="flex-1 min-h-0 relative">
                      <div className="absolute inset-0 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                        <div className="p-4">
                          <VariantCrewList 
                            projectId={projectId}
                            variantId={selectedVariantObject?.id || ''}
                            variantName={selectedVariant}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Layers className={cn('h-12 w-12 mx-auto mb-4', operationalColors.text)} />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    No variant selected
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Select a variant tab above to view and manage its equipment and crew assignments.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Group Creation Dialog */}
      <GroupDialogs
        groups={equipmentData?.equipment_groups || []}
        deleteDialogOpen={false} // Not handling deletes at this level
        newGroupDialogOpen={showNewGroupDialog}
        groupToDelete={null}
        targetGroupId=""
        newGroupName={newGroupName}
        onDeleteDialogOpenChange={() => {}}
        onNewGroupDialogOpenChange={(open) => {
          setShowNewGroupDialog(open);
          if (!open) {
            setNewGroupName("");
            setPendingEquipmentForGroup(null);
          }
        }}
        onTargetGroupSelect={() => {}}
        onNewGroupNameChange={setNewGroupName}
        onConfirmDelete={() => {}}
        onConfirmCreate={pendingEquipmentForGroup ? handleCreateGroupWithEquipment : async () => {
          const newGroup = await handleCreateGroup();
          if (newGroup) {
            // Auto-select the newly created group
            setSelectedGroupId(newGroup.id);
            
            // Scroll to the newly created group (with slight delay to ensure DOM update)
            setTimeout(() => {
              setScrollToItemId(newGroup.id);
              setTimeout(() => setScrollToItemId(null), 1000);
            }, 100);
          }
          setShowNewGroupDialog(false);
          setNewGroupName("");
        }}
      />
    </div>
  );
}