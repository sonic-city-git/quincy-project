// Variant Selector Component
// Dropdown selector for choosing between project variants (Trio, Band, DJ, etc.)

import { ChevronDown, Layers, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ProjectVariant } from '@/types/variants';
import { FORM_PATTERNS, COMPONENT_CLASSES, cn } from '@/design-system';

interface VariantSelectorProps {
  variants: ProjectVariant[];
  selectedVariant: string;
  onVariantSelect: (variantName: string) => void;
  isLoading?: boolean;
}

export function VariantSelector({
  variants,
  selectedVariant,
  onVariantSelect,
  isLoading = false
}: VariantSelectorProps) {
  // Find the currently selected variant
  const currentVariant = variants.find(v => v.variant_name === selectedVariant);
  const defaultVariant = variants.find(v => v.is_default);

  // Sort variants: default first, then by sort_order
  const sortedVariants = [...variants].sort((a, b) => {
    if (a.is_default) return -1;
    if (b.is_default) return 1;
    return (a.sort_order || 0) - (b.sort_order || 0);
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 bg-muted rounded animate-pulse" />
          <div className="space-y-1">
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            <div className="h-3 w-16 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="h-8 w-8 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (variants.length === 0) {
    return (
      <div className="flex items-center justify-center p-6 border border-dashed border-border rounded-lg">
        <div className="text-center">
          <Layers className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <div className="text-sm font-medium text-muted-foreground mb-1">No variants configured</div>
          <div className="text-xs text-muted-foreground">Create your first variant to get started</div>
        </div>
      </div>
    );
  }

  if (variants.length === 1) {
    // Single variant - show as static display
    const variant = variants[0];
    return (
      <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-background">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 text-indigo-500">
            <Layers className="h-full w-full" />
          </div>
          <div>
            <div className="font-medium text-sm flex items-center gap-2">
              {variant.display_name}
              {variant.is_default && (
                <Badge variant="outline" className="text-xs px-1.5 py-0.5 h-5">
                  <Star className="h-2.5 w-2.5 mr-1 fill-current" />
                  Default
                </Badge>
              )}
            </div>
            {variant.description && (
              <div className="text-xs text-muted-foreground">
                {variant.description}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className={cn(
            "w-full justify-between p-3 h-auto",
            "hover:bg-muted/50 focus:bg-muted/50"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 text-indigo-500">
              <Layers className="h-full w-full" />
            </div>
            <div className="text-left">
              <div className="font-medium text-sm flex items-center gap-2">
                {currentVariant?.display_name || 'Select Variant'}
                {currentVariant?.is_default && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0.5 h-5">
                    <Star className="h-2.5 w-2.5 mr-1 fill-current" />
                    Default
                  </Badge>
                )}
              </div>
              {currentVariant?.description && (
                <div className="text-xs text-muted-foreground">
                  {currentVariant.description}
                </div>
              )}
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-80" align="start">
        <DropdownMenuLabel className="text-xs">Project Variants</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {sortedVariants.map((variant) => (
          <DropdownMenuItem
            key={variant.id}
            onClick={() => onVariantSelect(variant.variant_name)}
            className={cn(
              "flex items-center gap-3 p-3 cursor-pointer",
              selectedVariant === variant.variant_name && "bg-muted"
            )}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">
                  {variant.display_name}
                </span>
                {variant.is_default && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0.5 h-5">
                    <Star className="h-2.5 w-2.5 mr-1 fill-current" />
                    Default
                  </Badge>
                )}
                {selectedVariant === variant.variant_name && (
                  <Badge variant="default" className="text-xs px-1.5 py-0.5 h-5">
                    Active
                  </Badge>
                )}
              </div>
              {variant.description && (
                <div className="text-xs text-muted-foreground">
                  {variant.description}
                </div>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}