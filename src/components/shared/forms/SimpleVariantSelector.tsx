/**
 * 🎯 SIMPLE VARIANT SELECTOR
 * 
 * Just a dropdown. No magic. No complexity. No flicker.
 * Exactly like every other dropdown in the universe.
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Layers } from "lucide-react";
import { ProjectVariant } from '@/types/variants';

interface SimpleVariantSelectorProps {
  variants: ProjectVariant[];
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  showLabel?: boolean;
  className?: string;
}

export function SimpleVariantSelector({
  variants,
  value,
  onValueChange,
  disabled = false,
  placeholder = "Select variant",
  showLabel = true,
  className
}: SimpleVariantSelectorProps) {
  
  // If no variants, fall back to "default" option 
  if (!variants.length) {
    return (
      <div className={className}>
        {showLabel && (
          <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
            <Layers className="h-4 w-4 text-indigo-500" />
            Variant
          </label>
        )}
        <Select 
          value="default" 
          onValueChange={onValueChange}
          disabled={disabled}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Default" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">
              <div className="flex items-center gap-2">
                <span>Default</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className={className}>
      {showLabel && (
        <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
          <Layers className="h-4 w-4 text-indigo-500" />
          Variant
        </label>
      )}
      
      <Select 
        value={value} 
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        
        <SelectContent>
          {variants.map((variant) => (
            <SelectItem key={variant.id} value={variant.variant_name}>
              <div className="flex items-center gap-2">
                <span>{variant.variant_name}</span>
                {variant.is_default && (
                  <span className="text-xs text-muted-foreground bg-muted px-1 rounded">
                    default
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
