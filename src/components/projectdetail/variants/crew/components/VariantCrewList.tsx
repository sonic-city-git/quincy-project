/**
 * 🎯 VARIANT CREW LIST - SIMPLIFIED FOR NEW LAYOUT
 * 
 * ✅ Shows only the variant's assigned crew roles
 * ✅ Design system compliant
 * ✅ Compact view for right panel
 */

import { Users } from 'lucide-react';
import { STATUS_COLORS } from '@/components/dashboard/shared/StatusCard';
import { cn } from '@/design-system';
import { CompactCrewRolesList } from './CompactCrewRolesList';
import { useVariantCrew } from '@/hooks/useVariantCrew';

interface VariantCrewListProps {
  projectId: string;
  variantName: string;
}

export function VariantCrewList({ 
  projectId, 
  variantName 
}: VariantCrewListProps) {
  const { 
    crewRoles, 
    isLoading, 
    error 
  } = useVariantCrew(projectId, variantName);

  // Calculate crew stats
  const totalRoles = crewRoles?.length || 0;

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="animate-pulse space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-muted/50 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <Users className="h-8 w-8 mx-auto mb-2 text-destructive" />
        <p className="text-sm text-destructive">Failed to load crew roles</p>
      </div>
    );
  }

  return (
    <div>
      {/* Crew Content */}
      {totalRoles > 0 ? (
        <CompactCrewRolesList 
          projectId={projectId} 
          variantName={variantName} 
        />
      ) : (
        <div className="text-center py-8">
          <Users className={cn('h-12 w-12 mx-auto mb-4', STATUS_COLORS.operational.text)} />
          <h3 className="font-medium text-sm mb-2">No crew roles assigned</h3>
          <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto">
            Use the "Add Role" button above to get started.
          </p>
        </div>
      )}
    </div>
  );
}