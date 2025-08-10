/**
 * 🌐 GLOBAL DOMAIN HOOKS
 * 
 * All hooks for global functionality, search, conflicts, and cross-domain operations.
 */

export { useGlobalSearch } from './useGlobalSearch';
export { useGlobalKeyboard } from './useGlobalKeyboard';
// ❌ DELETED: useDashboardConflicts, useConsolidatedConflicts - replaced by EQUIPMENT STOCK ENGINE
// ✅ OPTIMIZED WRAPPERS:
// import { useDashboardConflicts } from '@/hooks/useDashboardConflicts';
// import { useProjectConflicts } from '@/hooks/useProjectConflicts';
// import { useTimelineStock } from '@/hooks/useTimelineStock';
// ✅ CORE ENGINE: import { useEquipmentStockEngine } from '@/hooks/useEquipmentStockEngine';
