/**
 * 🎯 STOCK ENGINE EXPORTS
 * 
 * Central exports for the unified stock management system
 */

// Main engine hooks
export { 
  useStockEngine,
  useDashboardStockConflicts,
  useProjectStockConflicts,
  useTimelineStockEngine,
  useEffectiveStock
} from './useStockEngine';

// Subrental order management (will be created in next phase)
// export { useSubrentalOrders, useCreateSubrentalOrder } from './useSubrentalOrders';

// Virtual stock utilities (will be created in next phase)  
// export { useVirtualStock } from './useVirtualStock';

// Core calculation services  
export * from '../../services/stock/stockCalculations';
export * from '../../services/stock/conflictAnalysis';

// Types
export * from '../../types/stock';
