// Project Resources Tab - Unified crew and equipment management with variants
// Replaces separate Equipment and Crew tabs with variant-aware interface

import { useState } from 'react';
import { Project } from '@/types/projects';
import { ProjectTabCard } from '../shared/ProjectTabCard';
import { LayersIcon } from 'lucide-react';
import { VariantsContent } from './components/VariantsContent';
import { CreateVariantDialog } from './components/CreateVariantDialog';
import { EditVariantDialog } from './components/EditVariantDialog';
import { useProjectVariants } from '@/hooks/useProjectVariants';
import { ErrorBoundary } from 'react-error-boundary';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface VariantsTabProps {
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

export function VariantsTab({ projectId, project }: VariantsTabProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingVariant, setEditingVariant] = useState<any>(null);

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

  // Check if this is an artist project (should show variants)
  const isArtistProject = project?.customer_type === 'artist';

  // Handle variant management actions
  const handleCreateVariant = async (data: any) => {
    await createVariant(data);
    setShowCreateDialog(false);
  };

  const handleUpdateVariant = async (data: any) => {
    await updateVariant(data);
    setEditingVariant(null);
  };

  const handleEditVariant = (variant: any) => {
    setEditingVariant(variant);
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

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <ProjectTabCard
        title="Variants"
        icon={LayersIcon}
        iconColor="text-indigo-500"
      >
        <VariantsContent
          projectId={projectId}
          variants={variants}
          selectedVariant={selectedVariant}
          onVariantSelect={setSelectedVariant}
          isLoading={variantsLoading}
          onEditVariant={handleEditVariant}
          onCreateVariant={() => setShowCreateDialog(true)}
        />

        {/* Variant Management Dialogs */}
        <CreateVariantDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onCreateVariant={handleCreateVariant}
          existingVariants={variants}
        />

        {editingVariant && (
          <EditVariantDialog
            open={!!editingVariant}
            onOpenChange={() => setEditingVariant(null)}
            variant={editingVariant}
            onUpdateVariant={handleUpdateVariant}
            existingVariants={variants}
          />
        )}
      </ProjectTabCard>
    </ErrorBoundary>
  );
}