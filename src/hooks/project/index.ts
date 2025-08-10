/**
 * 📁 PROJECT DOMAIN HOOKS
 * 
 * All hooks related to project management, variants, and configuration.
 */

export { useProjectVariants } from './useProjectVariants';
export { useProjectDetails } from './useProjectDetails';
export { useProjectPGA, useBatchProjectPGA } from './useProjectPGA';
// ❌ DELETED: useProjectConflicts - replaced by EQUIPMENT STOCK ENGINE  
// ✅ Use: import { useProjectStock } from '@/hooks/useEquipmentStockEngine';
export { useProjectFilters } from './useProjectFilters';
export { useProjects } from './useProjects';
export { useAddProject } from './useAddProject';
export { useUpdateProject } from './useUpdateProject';
