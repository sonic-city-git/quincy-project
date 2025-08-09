/**
 * 📋 QUINCY CONSTANTS INDEX
 * 
 * Central export for all application constants.
 * Organized by category for easy imports.
 */

// ============================================================================
// CORE SYSTEM CONSTANTS
// ============================================================================

// App Logic (immutable technical foundation)
export * from './appLogic';

// Business Rules (configurable rules)
export * from './businessRules';

// ============================================================================
// EXISTING CONSTANTS (PRESERVED)
// ============================================================================

// Theme and UI constants
export * from './theme';

// Event-related constants
export * from './eventColors';
export * from './eventStatus';

// Time and scheduling constants
export * from './timeframes';

// Organization-specific constants
export * from './organizations';

// ============================================================================
// CONVENIENCE RE-EXPORTS
// ============================================================================

// Main business rules object for easy access
export { BUSINESS_RULES } from './businessRules';

// App logic validation helpers
export { 
  validateVariantName,
  isValidEventStatus, 
  isValidProjectType 
} from './appLogic';

// System invariants for runtime checks
export { SYSTEM_INVARIANTS, DB_CONSTRAINTS } from './appLogic';
