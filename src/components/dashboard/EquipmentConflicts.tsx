/**
 * EQUIPMENT CONFLICTS - ONE ENGINE VERSION
 * 
 * ✅ MIGRATED TO ONE ENGINE ARCHITECTURE
 * ❌ DELETED: useDashboardConflicts (fragmented logic)
 * ✅ USES: useDashboardConflicts (optimized dashboard wrapper)
 * 
 * Benefits:
 * - Virtual stock calculations (subrentals add to availability)
 * - Real-time conflict resolution indicators
 * - Single source of truth
 * - No translation layers
 */

import { AlertTriangle, TrendingUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDisplayDate } from "@/utils/dateFormatters";
import { useDashboardConflicts } from "@/hooks/useDashboardConflicts";

interface EquipmentConflictsProps {
  ownerId?: string;
}

export function EquipmentConflicts({ ownerId }: EquipmentConflictsProps) {
  
  // ONE ENGINE - Direct access to conflict data (Dashboard focus: counts only)
  const {
    conflicts,
    isLoading,
    error
  } = useDashboardConflicts(ownerId);
  
  // Show only actionable conflicts (medium/high severity)
  const displayConflicts = conflicts
    .filter(c => c.severity !== 'low')
    .slice(0, 5); // Limit to 5 most critical

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Error loading conflicts: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (!displayConflicts?.length) {
    return (
      <div className="text-center py-6">
        <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
        <div className="text-muted-foreground">
          No equipment conflicts found
        </div>
        <div className="text-xs text-green-600 mt-1">
          Virtual stock engine monitoring all equipment
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      
      {/* Conflicts List */}
      {displayConflicts.map((conflict) => (
        <Alert 
          key={`${conflict.equipmentId}-${conflict.date}`} 
          variant={conflict.severity === 'high' || conflict.severity === 'critical' ? 'destructive' : 'default'}
          className={conflict.severity === 'high' || conflict.severity === 'critical' ? '' : 'border-yellow-200 bg-yellow-50/10'}
        >
          <AlertTriangle className={`h-4 w-4 ${
            conflict.severity === 'high' || conflict.severity === 'critical' ? 'text-red-500' : 'text-yellow-500'
          }`} />
          <AlertDescription>
            <div className="space-y-1">
              
              {/* Equipment & Date */}
              <div className="font-medium">
                {conflict.equipmentName} - {formatDisplayDate(new Date(conflict.date))}
              </div>
              
              {/* Virtual Stock Information */}
              <div className="text-sm">
                Overbooked by {conflict.conflict.deficit} • 
                Base Stock: {conflict.stockBreakdown.baseStock} • 
                Used: {conflict.stockBreakdown.totalUsed}
                {conflict.stockBreakdown.virtualAdditions > 0 && (
                  <span className="text-blue-600">
                    {" "}• Virtual: +{conflict.stockBreakdown.virtualAdditions}
                  </span>
                )}
              </div>
              
              {/* Affected Events */}
              <div className="text-xs">
                Events: {conflict.conflict.affectedEvents.map(event => 
                  `${event.projectName}: ${event.eventName} (${event.quantity}x)`
                ).join(' • ')}
              </div>
              
              {/* Potential Solutions Count (Dashboard overview) */}
              {conflict.conflict.potentialSolutions.length > 0 && (
                <div className="text-xs text-blue-600">
                  💡 {conflict.conflict.potentialSolutions.length} solution(s) available
                </div>
              )}
              
            </div>
          </AlertDescription>
        </Alert>
      ))}
      
      {/* Summary Footer */}
      {conflicts.length > displayConflicts.length && (
        <div className="text-xs text-center text-muted-foreground pt-2 border-t">
          Showing {displayConflicts.length} of {conflicts.length} total conflicts
        </div>
      )}
      
    </div>
  );
}

EquipmentConflicts.Icon = AlertTriangle;