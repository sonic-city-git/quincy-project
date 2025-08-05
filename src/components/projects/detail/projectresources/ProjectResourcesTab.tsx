// Project Resources Tab - Unified crew and equipment management with variants
// Replaces separate Equipment and Crew tabs with variant-aware interface

import { useState } from 'react';
import { Project } from '@/types/projects';
import { ProjectTabCard } from '../../shared/ProjectTabCard';
import { LayersIcon } from 'lucide-react';
import { VariantSelector } from './components/VariantSelector';
import { ProjectResourcesContent } from './components/ProjectResourcesContent';
import { VariantActions } from './components/VariantActions';
import { useProjectVariants } from '@/hooks/useProjectVariants';
import { useVariantResources } from '@/hooks/useVariantResources';
import { ErrorBoundary } from 'react-error-boundary';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface ProjectResourcesTabProps {
  projectId: string;
  project?: Project;
}

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center">
      <div className="text-destructive font-medium">Something went wrong with the resources tab</div>
      <div className="text-sm text-muted-foreground max-w-md">
        {error.message}
      </div>
      <Button onClick={resetErrorBoundary} variant="outline" size="sm">
        <RefreshCw className="h-4 w-4 mr-2" />
        Try again
      </Button>
    </div>
  );
}

export function ProjectResourcesTab({ projectId, project }: ProjectResourcesTabProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Variant management
  const {
    variants,
    selectedVariant,
    setSelectedVariant,
    isLoading: variantsLoading,
    error: variantsError,
    createVariant,
    updateVariant,
    deleteVariant,
    duplicateVariant
  } = useProjectVariants(projectId);

  // Resource data for selected variant
  const {
    resourceData,
    isLoading: resourcesLoading,
    error: resourcesError,
    addCrewRole,
    updateCrewRole,
    removeCrewRole,
    addEquipmentItem,
    updateEquipmentItem,
    removeEquipmentItem,
    createEquipmentGroup,
    updateEquipmentGroup,
    deleteEquipmentGroup
  } = useVariantResources(projectId, selectedVariant);

  // Check if this is an artist project (should show variants)
  const isArtistProject = project?.customer_type === 'artist';

  // Toggle equipment group expansion
  const toggleGroupExpansion = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  // Error states
  if (variantsError) {
    return (
      <ProjectTabCard
        title="Resources"
        icon={LayersIcon}
        iconColor="text-indigo-500"
      >
        <div className="text-center py-8">
          <div className="text-destructive font-medium mb-2">Failed to load variants</div>
          <div className="text-sm text-muted-foreground">{variantsError.message}</div>
        </div>
      </ProjectTabCard>
    );
  }

  if (resourcesError) {
    return (
      <ProjectTabCard
        title="Resources"
        icon={LayersIcon}
        iconColor="text-indigo-500"
      >
        <div className="text-center py-8">
          <div className="text-destructive font-medium mb-2">Failed to load resources</div>
          <div className="text-sm text-muted-foreground">{resourcesError.message}</div>
        </div>
      </ProjectTabCard>
    );
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <ProjectTabCard
        title="Resources"
        icon={LayersIcon}
        iconColor="text-indigo-500"
      >
        <div className="space-y-6">
          {/* Variant Management Section - Only for artist projects */}
          {isArtistProject && (
            <div className="space-y-4">
              {/* Variant Selector */}
              <VariantSelector
                variants={variants}
                selectedVariant={selectedVariant}
                onVariantSelect={setSelectedVariant}
                isLoading={variantsLoading}
              />

              {/* Variant Actions */}
              <VariantActions
                projectId={projectId}
                variants={variants}
                selectedVariant={selectedVariant}
                onCreateVariant={createVariant}
                onUpdateVariant={updateVariant}
                onDeleteVariant={deleteVariant}
                onDuplicateVariant={duplicateVariant}
              />
            </div>
          )}

          {/* Resources Content */}
          <ProjectResourcesContent
            projectId={projectId}
            variantName={selectedVariant}
            resourceData={resourceData}
            isLoading={resourcesLoading || variantsLoading}
            expandedGroups={expandedGroups}
            onToggleGroup={toggleGroupExpansion}
            
            // Crew operations
            onAddCrewRole={addCrewRole}
            onUpdateCrewRole={updateCrewRole}
            onRemoveCrewRole={removeCrewRole}
            
            // Equipment operations
            onAddEquipmentItem={addEquipmentItem}
            onUpdateEquipmentItem={updateEquipmentItem}
            onRemoveEquipmentItem={removeEquipmentItem}
            
            // Group operations
            onCreateEquipmentGroup={createEquipmentGroup}
            onUpdateEquipmentGroup={updateEquipmentGroup}
            onDeleteEquipmentGroup={deleteEquipmentGroup}
          />

          {/* Empty State for Non-Artist Projects */}
          {!isArtistProject && (!resourceData || (
            resourceData.crew_roles.length === 0 && 
            resourceData.equipment_groups.length === 0 && 
            resourceData.equipment_ungrouped.length === 0
          )) && (
            <div className="text-center py-12">
              <LayersIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                No resources configured
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {isArtistProject 
                  ? "Create variants (like Trio, Band, DJ) to organize your crew roles and equipment requirements."
                  : "Add crew roles and equipment for this project. Use the buttons above to get started."
                }
              </p>
            </div>
          )}
        </div>
      </ProjectTabCard>
    </ErrorBoundary>
  );
}