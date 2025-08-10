/**
 * 🎯 CONFLICT ANALYSIS SERVICE
 * 
 * Analyzes stock conflicts and generates actionable solutions.
 * Replaces scattered conflict detection logic throughout the app.
 */

import { 
  ConflictAnalysis, 
  ConflictSeverity, 
  ConflictSolution, 
  EffectiveStock,
  ConflictFilters,
  SubrentalSuggestion,
  ProviderSuggestion
} from "@/types/stock";
import { calculateBatchEffectiveStock } from "./stockCalculations";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, parseISO } from 'date-fns';

// =============================================================================
// CONFLICT DETECTION
// =============================================================================

/**
 * Analyze conflicts for multiple equipment over date range
 * Shows ACTUAL remaining problems after subrentals and repairs
 */
export async function analyzeConflicts(
  equipmentIds: string[],
  startDate: string,
  endDate: string,
  filters?: ConflictFilters
): Promise<ConflictAnalysis[]> {
  // Get effective stock for all equipment/dates
  // This already includes: Stock + Subrental - Repairs - Equipment Booked
  const stockData = await calculateBatchEffectiveStock(equipmentIds, startDate, endDate);
  
  const conflicts: ConflictAnalysis[] = [];

  stockData.forEach((dateMap, equipmentId) => {
    dateMap.forEach((stock, date) => {
      // SIMPLE: available < 0 = conflict (stock - repairs + subrental - booked < 0)
      if (stock.available < 0) {
        const analysis = analyzeStockConflict(stock);
        
        // Apply filters if provided
        if (shouldIncludeConflict(analysis, filters)) {
          conflicts.push(analysis);
        }
      }
    });
  });
  
  // Conflicts detected and ready for dashboard

  // Sort by severity and urgency
  return conflicts.sort(compareConflictPriority);
}

/**
 * Analyze a single stock conflict in detail
 */
export function analyzeStockConflict(stock: EffectiveStock): ConflictAnalysis {
  const severity = calculateConflictSeverity(stock);
  const solutions = generateConflictSolutions(stock);
  const affectedEvents = []; // Will be populated by booking details

  return {
    equipmentId: stock.equipmentId,
    equipmentName: stock.equipmentName,
    date: stock.date,
    severity,
    conflict: {
      deficit: stock.deficit,
      deficitPercentage: (stock.deficit / stock.totalUsed) * 100,
      affectedEvents,
      potentialSolutions: solutions
    },
    stockBreakdown: stock
  };
}

/**
 * Calculate conflict severity based on deficit and business impact
 */
function calculateConflictSeverity(stock: EffectiveStock): ConflictSeverity {
  const deficitRatio = stock.deficit / stock.effectiveStock;
  const usageRatio = stock.totalUsed / stock.effectiveStock;

  // Critical: High deficit or complete stock exhaustion
  if (deficitRatio > 1.0 || stock.effectiveStock === 0) {
    return 'critical';
  }

  // High: Significant deficit relative to stock
  if (deficitRatio > 0.5 || usageRatio > 2.0) {
    return 'high';
  }

  // Medium: Moderate deficit
  if (deficitRatio > 0.2 || usageRatio > 1.5) {
    return 'medium';
  }

  // Low: Minor deficit
  return 'low';
}

/**
 * Generate potential solutions for a conflict
 */
function generateConflictSolutions(stock: EffectiveStock): ConflictSolution[] {
  const solutions: ConflictSolution[] = [];

  // Solution 1: Subrental (most common)
  solutions.push({
    type: 'subrental',
    description: `Rent ${stock.deficit} additional units from external provider`,
    estimatedCost: estimateSubrentalCost(stock.deficit),
    feasibilityScore: 85,
    suggestedProviders: [] // Will be populated by provider analysis
  });

  // Solution 2: Reduce quantity (if minor deficit)
  if (stock.deficit <= 2) {
    solutions.push({
      type: 'reduce_quantity',
      description: `Reduce equipment requirements by ${stock.deficit} units`,
      estimatedCost: 0,
      feasibilityScore: 60
    });
  }

  // Solution 3: Reschedule (if not time-critical)
  solutions.push({
    type: 'reschedule',
    description: 'Reschedule conflicting events to different dates',
    estimatedCost: 0,
    feasibilityScore: 40
  });

  // Solution 4: Substitute (if alternative equipment available)
  solutions.push({
    type: 'substitute',
    description: 'Use alternative compatible equipment',
    estimatedCost: 0,
    feasibilityScore: 50
  });

  return solutions.sort((a, b) => b.feasibilityScore - a.feasibilityScore);
}

// =============================================================================
// SUBRENTAL SUGGESTIONS
// =============================================================================

/**
 * Generate subrental suggestions from conflicts
 */
export async function generateSubrentalSuggestions(
  conflicts: ConflictAnalysis[],
  includeProviderAnalysis = true
): Promise<SubrentalSuggestion[]> {
  const suggestions: SubrentalSuggestion[] = [];

  for (const conflict of conflicts) {
    // Only suggest subrentals for significant conflicts
    if (conflict.severity === 'low') continue;

    const suggestion: SubrentalSuggestion = {
      equipmentId: conflict.equipmentId,
      equipmentName: conflict.equipmentName,
      date: conflict.date,
      deficit: conflict.conflict.deficit,
      conflictAnalysis: conflict,
      suggestedProviders: [],
      estimatedCost: estimateSubrentalCost(conflict.conflict.deficit),
      urgencyScore: calculateUrgencyScore(conflict)
    };

    // Add provider analysis if requested
    if (includeProviderAnalysis) {
      suggestion.suggestedProviders = await analyzeProviders(
        conflict.equipmentName,
        conflict.conflict.deficit
      );
    }

    suggestions.push(suggestion);
  }

  // Sort by urgency and deficit
  return suggestions.sort((a, b) => {
    if (a.urgencyScore !== b.urgencyScore) {
      return b.urgencyScore - a.urgencyScore;
    }
    return b.deficit - a.deficit;
  });
}

/**
 * Analyze external providers for subrental recommendations
 */
async function analyzeProviders(
  equipmentName: string,
  quantity: number
): Promise<ProviderSuggestion[]> {
  // Phase 6: Create external_providers table for subrental suggestions
  const providers: any[] = [];

  return []; // Phase 6: Implement provider analysis when external_providers table exists
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if conflict should be included based on filters
 */
function shouldIncludeConflict(
  conflict: ConflictAnalysis,
  filters?: ConflictFilters
): boolean {
  if (!filters) return true;

  // Severity filter
  if (filters.severity && !filters.severity.includes(conflict.severity)) {
    return false;
  }

  // Equipment filter
  if (filters.equipmentIds && !filters.equipmentIds.includes(conflict.equipmentId)) {
    return false;
  }

  // Date range filter
  if (filters.dateRange) {
    const conflictDate = conflict.date;
    if (conflictDate < filters.dateRange.start || conflictDate > filters.dateRange.end) {
      return false;
    }
  }

  return true;
}

/**
 * Compare conflicts for priority sorting
 */
function compareConflictPriority(a: ConflictAnalysis, b: ConflictAnalysis): number {
  // Primary: Severity
  const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
  const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
  if (severityDiff !== 0) return severityDiff;

  // Secondary: Deficit size
  const deficitDiff = b.conflict.deficit - a.conflict.deficit;
  if (deficitDiff !== 0) return deficitDiff;

  // Tertiary: Date proximity (closer dates first)
  const today = new Date();
  const aDays = differenceInDays(parseISO(a.date), today);
  const bDays = differenceInDays(parseISO(b.date), today);
  return Math.abs(aDays) - Math.abs(bDays);
}

/**
 * Calculate urgency score for subrental suggestion
 */
function calculateUrgencyScore(conflict: ConflictAnalysis): number {
  let score = 0;

  // Severity contribution (0-40 points)
  const severityScores = { critical: 40, high: 30, medium: 20, low: 10 };
  score += severityScores[conflict.severity];

  // Date proximity contribution (0-30 points)
  const today = new Date();
  const daysUntil = differenceInDays(parseISO(conflict.date), today);
  if (daysUntil <= 3) score += 30;
  else if (daysUntil <= 7) score += 20;
  else if (daysUntil <= 14) score += 10;

  // Deficit size contribution (0-30 points)
  const deficitRatio = conflict.conflict.deficit / conflict.stockBreakdown.totalUsed;
  if (deficitRatio >= 0.5) score += 30;
  else if (deficitRatio >= 0.3) score += 20;
  else if (deficitRatio >= 0.1) score += 10;

  return Math.min(100, score); // Cap at 100
}

/**
 * Estimate subrental cost based on quantity
 */
function estimateSubrentalCost(quantity: number): number {
  // Rough estimation - in real implementation, this would use
  // historical data and provider rate cards
  const averageDailyCost = 150; // Base cost per unit per day
  return quantity * averageDailyCost;
}

/**
 * Estimate cost from specific provider
 */
function estimateProviderCost(provider: any, quantity: number): number {
  const baseCost = estimateSubrentalCost(quantity);
  
  // Adjust based on provider rating
  const ratingMultiplier = provider.preferred_status ? 1.1 : 1.0;
  const reliabilityMultiplier = 1 + ((provider.reliability_rating || 3) - 3) * 0.1;
  
  return Math.round(baseCost * ratingMultiplier * reliabilityMultiplier);
}

/**
 * Calculate provider availability confidence
 */
function calculateAvailabilityConfidence(provider: any, equipmentName: string): number {
  let confidence = 70; // Base confidence

  // Adjust based on provider status
  if (provider.preferred_status) confidence += 15;
  
  // Adjust based on reliability rating
  confidence += (provider.reliability_rating || 3) * 5;

  // Phase 6: Add equipment category matching logic
  // Phase 6: Add historical availability data

  return Math.min(100, Math.max(0, confidence));
}

// Functions are already exported inline above - no need for explicit exports block
