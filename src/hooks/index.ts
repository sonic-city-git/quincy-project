/**
 * 🎣 QUINCY HOOKS - ORGANIZED BY DOMAIN
 * 
 * Phase 3: Code Quality Restoration
 * Clean, organized hook exports by business domain.
 */

// Project Management
export * from './project';

// Variant Configuration  
export * from './variant';

// Stock Engine
// ❌ DELETED: export * from './stock' - old fragmented hooks removed
// ✅ Use: import from '@/hooks/useEquipmentStockEngine' directly

// Event Operations
export * from './event';

// Crew Management
export * from './crew';

// Equipment Management
export * from './equipment';

// Customer Relations
export * from './customer';

// Invoice Management
export * from './invoice';

// Calendar Functionality
export * from './calendar';

// Global Operations
export * from './global';

// UI & Interaction
export * from './ui';

// Shared Utilities
export * from './shared';

// Pricing Service (Phase 2 Architecture)
export * from '../services/pricing';
