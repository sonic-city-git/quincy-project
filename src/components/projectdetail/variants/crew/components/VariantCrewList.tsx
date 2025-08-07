/**
 * 🎯 VARIANT CREW LIST - SIMPLIFIED FOR NEW LAYOUT
 * 
 * ✅ Shows only the variant's assigned crew roles
 * ✅ Design system compliant
 * ✅ Compact view for right panel
 */

import { Plus, Users, UserCheck, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { STATUS_COLORS } from '@/components/dashboard/shared/StatusCard';
import { CompactCrewRolesList } from './CompactCrewRolesList';
import { useVariantResources } from '@/hooks/useVariantResources';

interface VariantCrewListProps {
  projectId: string;
  variantName: string;
}

export function VariantCrewList({ 
  projectId, 
  variantName 
}: VariantCrewListProps) {
  const { 
    resourceData, 
    isLoading, 
    error 
  } = useVariantResources(projectId, variantName);

  const successColors = STATUS_COLORS.success;
  const warningColors = STATUS_COLORS.warning;
  const infoColors = STATUS_COLORS.info;

  // Calculate crew stats
  const totalRoles = resourceData?.crew_roles?.length || 0;
  const assignedRoles = resourceData?.crew_roles?.filter(role => role.assigned_member_id).length || 0;
  const unassignedRoles = totalRoles - assignedRoles;

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
    <div className="space-y-4">
      {/* Crew Stats Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className={`h-4 w-4 ${infoColors.text}`} />
            <span className="text-sm font-medium">Total Roles</span>
          </div>
          <Badge variant="outline">
            {totalRoles}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className={`h-4 w-4 ${successColors.text}`} />
            <span className="text-sm font-medium">Assigned</span>
          </div>
          <Badge variant="outline" className={`${successColors.text} ${successColors.border}`}>
            {assignedRoles}
          </Badge>
        </div>

        {unassignedRoles > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className={`h-4 w-4 ${warningColors.text}`} />
              <span className="text-sm font-medium">Unassigned</span>
            </div>
            <Badge variant="outline" className={`${warningColors.text} ${warningColors.border}`}>
              {unassignedRoles}
            </Badge>
          </div>
        )}
      </div>

      {/* Crew Content */}
      {totalRoles > 0 ? (
        <div className="space-y-2">
          <CompactCrewRolesList 
            projectId={projectId} 
            variantName={variantName} 
          />
        </div>
      ) : (
        <div className="text-center py-8">
          <Users className={`h-12 w-12 mx-auto mb-4 ${STATUS_COLORS.operational.text}`} />
          <h3 className="font-medium text-sm mb-2">No crew roles assigned</h3>
          <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto">
            Add crew roles to this variant from the available resources panel.
          </p>
          
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add First Role
          </Button>
        </div>
      )}
    </div>
  );
}