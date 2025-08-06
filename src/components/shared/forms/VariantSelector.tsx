// Variant Selector Component
// Dropdown for selecting project variants when creating/editing events

import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, Layers, Plus } from "lucide-react";
import { ProjectVariant } from '@/types/variants';
import { getProjectVariants } from '@/utils/variantHelpers';
import { CreateVariantDialog } from '@/components/projectdetail/variants/components/CreateVariantDialog';
import { useProjectVariants } from '@/hooks/useProjectVariants';

interface VariantSelectorProps {
  projectId: string;
  value: string;
  onValueChange: (variantName: string) => void;
  disabled?: boolean;
  placeholder?: string;
  showLabel?: boolean;
  className?: string;
}

export function VariantSelector({
  projectId,
  value,
  onValueChange,
  disabled = false,
  placeholder = "Select variant",
  showLabel = true,
  className
}: VariantSelectorProps) {
  const [variants, setVariants] = useState<ProjectVariant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  // Use variant management for creating new variants
  const { createVariant } = useProjectVariants(projectId);

  // Load variants when component mounts or projectId changes
  useEffect(() => {
    if (!projectId) {
      setVariants([]);
      setIsLoading(false);
      return;
    }

    const loadVariants = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const projectVariants = await getProjectVariants(projectId);
        setVariants(projectVariants);
        
        // Auto-select appropriate variant
        const currentVariantExists = projectVariants.some(v => v.variant_name === value);
        const shouldAutoSelect = !value || value === 'default' || !currentVariantExists;
        
        if (shouldAutoSelect) {
          if (projectVariants.length === 1) {
            // Only one variant - select it
            onValueChange(projectVariants[0].variant_name);
          } else if (projectVariants.length > 1) {
            // Multiple variants - select the default one
            const defaultVariant = projectVariants.find(v => v.is_default);
            if (defaultVariant) {
              onValueChange(defaultVariant.variant_name);
            } else {
              // Fallback to first variant if no default is set
              onValueChange(projectVariants[0].variant_name);
            }
          }
        }
      } catch (err) {
        console.error('Error loading variants:', err);
        setError('Failed to load variants');
        // Fallback to default
        onValueChange('default');
      } finally {
        setIsLoading(false);
      }
    };

    loadVariants();
  }, [projectId, value, onValueChange]);

  // Handle creating a new variant
  const handleCreateVariant = async (variantData: any) => {
    try {
      const newVariant = await createVariant(variantData);
      // Refresh the variants list
      const updatedVariants = await getProjectVariants(projectId);
      setVariants(updatedVariants);
      // Auto-select the newly created variant
      onValueChange(newVariant.variant_name);
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Error creating variant:', error);
    }
  };

  // Always show selector so users can see which variant is being used

  return (
    <div className={`space-y-2 ${className}`}>
      {showLabel && (
        <label className="text-sm font-medium flex items-center gap-2">
          <Layers className="h-4 w-4 text-indigo-500" />
          Variant
        </label>
      )}
      
      <Select 
        value={value} 
        onValueChange={onValueChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger className="w-full">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading variants...</span>
            </div>
          ) : (
            <SelectValue placeholder={error || placeholder} />
          )}
        </SelectTrigger>
        
        <SelectContent>
          {variants.map((variant) => (
            <SelectItem key={variant.id} value={variant.variant_name}>
              <div className="flex items-center gap-2">
                <span>{variant.variant_name}</span>
                {variant.is_default && (
                  <span className="text-xs text-muted-foreground">(Default)</span>
                )}
              </div>
            </SelectItem>
          ))}
          
          {/* Add Variant Option */}
          <Separator className="my-1" />
          <div 
            className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-accent rounded-sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowCreateDialog(true);
            }}
          >
            <Plus className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Add Variant</span>
          </div>
        </SelectContent>
      </Select>
      
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
      
      {/* Create Variant Dialog */}
      <CreateVariantDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        projectId={projectId}
        onCreateVariant={handleCreateVariant}
        existingVariants={variants}
      />
    </div>
  );
}