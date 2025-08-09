/**
 * 💰 REACTIVE PRICING SERVICE
 * 
 * Phase 2 Architecture: Consolidated pricing system
 * - No stored pricing (eliminates sync requirements)
 * - Automatic updates with variant changes
 * - Business rule: "pricing follows variant"
 */

// Core pricing calculations
export { 
  calculateEventPricing, 
  calculateBatchEventPricing,
  type CalculatedPricing 
} from './calculations';

// React hooks for components
export { 
  useReactivePricing, 
  useBatchReactivePricing, 
  useEventsWithReactivePricing 
} from './hooks';

// Business rule configuration
export { 
  DEFAULT_PRICING_CONFIG, 
  CrewPricingSource 
} from '@/constants/businessRules';
