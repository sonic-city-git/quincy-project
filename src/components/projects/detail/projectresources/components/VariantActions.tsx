// Variant Actions Component
// Action buttons and dialogs for managing project variants

import { useState } from 'react';
import { Plus, Copy, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ProjectVariant, CreateVariantPayload, UpdateVariantPayload } from '@/types/variants';
import { CreateVariantDialog } from './CreateVariantDialog';
import { EditVariantDialog } from './EditVariantDialog';
import { DeleteVariantDialog } from './DeleteVariantDialog';
import { DuplicateVariantDialog } from './DuplicateVariantDialog';

interface VariantActionsProps {
  projectId: string;
  variants: ProjectVariant[];
  selectedVariant: string;
  onCreateVariant: (data: CreateVariantPayload) => Promise<ProjectVariant>;
  onUpdateVariant: (data: UpdateVariantPayload) => Promise<ProjectVariant>;
  onDeleteVariant: (variantName: string) => Promise<void>;
  onDuplicateVariant: (sourceVariant: string, newVariantData: CreateVariantPayload) => Promise<ProjectVariant>;
}

export function VariantActions({
  projectId,
  variants,
  selectedVariant,
  onCreateVariant,
  onUpdateVariant,
  onDeleteVariant,
  onDuplicateVariant
}: VariantActionsProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);

  const currentVariant = variants.find(v => v.variant_name === selectedVariant);
  const canDelete = variants.length > 1 && currentVariant && !currentVariant.is_default;

  const handleCreateVariant = async (data: CreateVariantPayload) => {
    await onCreateVariant(data);
    setShowCreateDialog(false);
  };

  const handleUpdateVariant = async (data: UpdateVariantPayload) => {
    await onUpdateVariant(data);
    setShowEditDialog(false);
  };

  const handleDeleteVariant = async () => {
    if (currentVariant) {
      await onDeleteVariant(currentVariant.variant_name);
      setShowDeleteDialog(false);
    }
  };

  const handleDuplicateVariant = async (data: CreateVariantPayload) => {
    await onDuplicateVariant(selectedVariant, data);
    setShowDuplicateDialog(false);
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {variants.length === 0 
            ? "No variants configured" 
            : `${variants.length} variant${variants.length === 1 ? '' : 's'} configured`
          }
        </div>
        
        <div className="flex items-center gap-2">
          {/* Create Variant Button */}
          <Button
            onClick={() => setShowCreateDialog(true)}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            New Variant
          </Button>

          {/* Variant Management Dropdown - Only show if we have variants */}
          {variants.length > 0 && currentVariant && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="text-xs">
                  Manage "{currentVariant.display_name}"
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem
                  onClick={() => setShowEditDialog(true)}
                  className="gap-2"
                >
                  <Pencil className="h-4 w-4" />
                  Edit Variant
                </DropdownMenuItem>
                
                <DropdownMenuItem
                  onClick={() => setShowDuplicateDialog(true)}
                  className="gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Duplicate Variant
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={!canDelete}
                  className="gap-2 text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Variant
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <CreateVariantDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreateVariant={handleCreateVariant}
        existingVariants={variants}
      />

      {currentVariant && (
        <>
          <EditVariantDialog
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            variant={currentVariant}
            onUpdateVariant={handleUpdateVariant}
            existingVariants={variants}
          />

          <DeleteVariantDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            variant={currentVariant}
            onDeleteVariant={handleDeleteVariant}
            canDelete={canDelete}
          />

          <DuplicateVariantDialog
            open={showDuplicateDialog}
            onOpenChange={setShowDuplicateDialog}
            sourceVariant={currentVariant}
            onDuplicateVariant={handleDuplicateVariant}
            existingVariants={variants}
          />
        </>
      )}
    </>
  );
}