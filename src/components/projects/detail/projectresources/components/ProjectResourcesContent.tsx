// Resources Content Component
// Main content area with variant tabs and equipment/crew sections

import { useState } from 'react';
import { Settings, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProjectVariant } from '@/types/variants';
import { VariantEquipmentSection } from './VariantEquipmentSection';
import { VariantCrewSection } from './VariantCrewSection';
import { LoadingSpinner } from '@/components/resources/shared/LoadingSpinner';
import { cn } from '@/lib/utils';

interface ProjectResourcesContentProps {
  projectId: string;
  variants: ProjectVariant[];
  selectedVariant: string;
  onVariantSelect: (variantName: string) => void;
  isLoading: boolean;
  onEditVariant?: (variant: ProjectVariant) => void;
  onCreateVariant?: () => void;
}

export function ProjectResourcesContent({
  projectId,
  variants,
  selectedVariant,
  onVariantSelect,
  isLoading,
  onEditVariant,
  onCreateVariant
}: ProjectResourcesContentProps) {

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingSpinner text="Loading variants..." />
      </div>
    );
  }

  const currentVariant = variants.find(v => v.variant_name === selectedVariant);

  return (
    <div className="space-y-6">
      {/* Variant Tabs */}
      <div className="border-b border-border">
        <div className="flex items-center gap-1">
          {variants.map((variant) => (
            <div key={variant.id} className="flex items-center">
              <button
                onClick={() => onVariantSelect(variant.variant_name)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors",
                  selectedVariant === variant.variant_name
                    ? "border-primary text-primary bg-muted/50"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                )}
              >
                <span>{variant.display_name}</span>
                {variant.is_default && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0.5 h-5">
                    Default
                  </Badge>
                )}
                {onEditVariant && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditVariant(variant);
                    }}
                    className="p-1 hover:bg-muted rounded opacity-60 hover:opacity-100"
                  >
                    <Settings className="h-3 w-3" />
                  </button>
                )}
              </button>
            </div>
          ))}
          
          {/* Add New Variant Button */}
          {onCreateVariant && (
            <button
              onClick={onCreateVariant}
              className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>New Variant</span>
            </button>
          )}
        </div>
      </div>

      {/* Variant Content */}
      {currentVariant ? (
        <div className="space-y-6">
          {/* Equipment + Crew Layout */}
          <div className="grid grid-cols-[2fr_1fr] gap-6">
            {/* Equipment Section (2 columns as before) */}
            <VariantEquipmentSection 
              projectId={projectId} 
              variantName={selectedVariant} 
            />
            
            {/* Crew Section (table as before) */}
            <VariantCrewSection 
              projectId={projectId} 
              variantName={selectedVariant} 
            />
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            No variant selected
          </h3>
          <p className="text-sm text-muted-foreground">
            Select a variant tab above to view its resources.
          </p>
        </div>
      )}
    </div>
  );
}