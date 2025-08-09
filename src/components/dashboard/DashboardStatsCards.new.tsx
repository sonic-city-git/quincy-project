/**
 * DASHBOARD STATS - ONE ENGINE VERSION
 * 
 * Shows how components use the ONE ENGINE directly.
 * No intermediary hooks, no translation layers.
 */

import React from 'react';
import { useDashboardStock } from '@/hooks/useGlobalStockEngine';
import { StandardizedCard } from '@/components/shared/StandardizedCard';
import { Zap, AlertTriangle, TrendingUp } from 'lucide-react';

interface DashboardStatsCardsProps {
  selectedOwner?: string;
}

export function DashboardStatsCards({ selectedOwner }: DashboardStatsCardsProps) {
  
  // ONE ENGINE - Direct usage, no translation
  const {
    conflicts,
    suggestions,
    totalConflicts,
    isLoading,
    error
  } = useDashboardStock(selectedOwner);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <StandardizedCard key={i} className="animate-pulse">
            <div className="h-20 bg-gray-100 rounded" />
          </StandardizedCard>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <StandardizedCard className="text-red-600">
        Error loading dashboard data: {error.message}
      </StandardizedCard>
    );
  }

  // DIRECT DATA USAGE - No transformation needed
  const equipmentConflicts = conflicts.filter(c => c.conflict.severity !== 'low');
  const urgentConflicts = conflicts.filter(c => c.conflict.severity === 'high');
  const availableSuggestions = suggestions.length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      
      {/* Equipment Conflicts */}
      <StandardizedCard>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Equipment Conflicts</p>
            <p className="text-2xl font-bold text-red-600">{equipmentConflicts.length}</p>
            {urgentConflicts.length > 0 && (
              <p className="text-xs text-red-500">
                {urgentConflicts.length} urgent
              </p>
            )}
          </div>
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
      </StandardizedCard>

      {/* Subrental Suggestions */}
      <StandardizedCard>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Subrental Options</p>
            <p className="text-2xl font-bold text-blue-600">{availableSuggestions}</p>
            <p className="text-xs text-gray-500">
              Available solutions
            </p>
          </div>
          <TrendingUp className="h-8 w-8 text-blue-500" />
        </div>
      </StandardizedCard>

      {/* System Status */}
      <StandardizedCard>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">System Status</p>
            <p className={`text-2xl font-bold ${totalConflicts === 0 ? 'text-green-600' : 'text-yellow-600'}`}>
              {totalConflicts === 0 ? 'All Clear' : 'Active Issues'}
            </p>
            <p className="text-xs text-gray-500">
              Real-time virtual stock
            </p>
          </div>
          <Zap className={`h-8 w-8 ${totalConflicts === 0 ? 'text-green-500' : 'text-yellow-500'}`} />
        </div>
      </StandardizedCard>
      
    </div>
  );
}
