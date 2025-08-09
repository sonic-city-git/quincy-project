/**
 * WARNING ANALYSIS UTILITIES - UNIFIED STOCK ENGINE VERSION
 * 
 * ✅ COMPLETELY REDESIGNED FOR UNIFIED STOCK ENGINE
 * 
 * Consolidates warning analysis using the new unified stock engine
 * with virtual stock calculations (subrentals & repairs).
 * 
 * Benefits:
 * - Virtual stock awareness (subrentals add, repairs reduce)
 * - Real-time conflict resolution
 * - Optimized batch calculations
 * - Consistent severity analysis
 * - Single source of truth
 */

import { ConflictAnalysis } from '@/types/stock';

export interface BaseWarning {
  hasIssues: boolean;
  issueCount: number;
  severity: 'low' | 'medium' | 'high';
  virtualStockAware: boolean; // NEW: Indicates virtual stock calculations
}

export interface WarningDetails {
  conflicts: ConflictAnalysis[];
  overbookings: number;
  virtualDeficits: number; // NEW: After virtual stock calculations
  affectedEquipment: string[];
  affectedDates: string[];
  suggestedActions: string[];
}

/**
 * Analyze conflicts from unified stock engine results
 */
export function analyzeStockEngineWarnings(
  conflicts: ConflictAnalysis[]
): BaseWarning & WarningDetails {
  
  const overbookings = conflicts.filter(c => c.conflict.deficit > 0).length;
  const virtualDeficits = conflicts.reduce((sum, c) => sum + c.conflict.deficit, 0);
  
  // Determine overall severity
  const severities = conflicts.map(c => c.conflict.severity);
  const overallSeverity = severities.includes('high') ? 'high' : 
                         severities.includes('medium') ? 'medium' : 'low';

  // Extract affected resources and dates
  const affectedEquipment = [...new Set(conflicts.map(c => c.equipmentName))];
  const affectedDates = [...new Set(conflicts.map(c => c.date))].sort();
  
  // Generate suggested actions
  const suggestedActions = generateSuggestedActions(conflicts);

  return {
    hasIssues: conflicts.length > 0,
    issueCount: conflicts.length,
    severity: overallSeverity,
    virtualStockAware: true,
    conflicts,
    overbookings,
    virtualDeficits,
    affectedEquipment,
    affectedDates,
    suggestedActions
  };
}

/**
 * Equipment-specific issue extraction using virtual stock
 */
export function extractEquipmentIssues(
  conflict: ConflictAnalysis
): { hasIssue: boolean; count: number; severity: string } {
  const hasIssue = conflict.conflict.deficit > 0;
  const count = conflict.conflict.deficit;
  
  return { 
    hasIssue, 
    count, 
    severity: conflict.conflict.severity
  };
}

/**
 * Generate intelligent action suggestions based on conflicts
 */
function generateSuggestedActions(conflicts: ConflictAnalysis[]): string[] {
  const actions: string[] = [];
  
  const hasHighSeverity = conflicts.some(c => c.conflict.severity === 'high');
  const hasSubrentalSuggestions = conflicts.some(c => c.conflict.suggestedActions.length > 0);
  
  if (hasHighSeverity) {
    actions.push('Immediate attention required - high severity conflicts');
  }
  
  if (hasSubrentalSuggestions) {
    actions.push('Consider subrental options from suggested providers');
  }
  
  const uniqueEquipment = new Set(conflicts.map(c => c.equipmentId)).size;
  if (uniqueEquipment > 1) {
    actions.push('Multiple equipment types affected - review full project scope');
  }
  
  return actions;
}

/**
 * Legacy crew issues - placeholder until crew integrated into stock engine
 */
export function extractCrewIssues(booking: any, crewMember: any) {
  // TODO: Integrate crew conflicts into unified stock engine
  return { hasIssue: false, count: 0 };
}