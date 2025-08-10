# 🎯 STOCK ENGINE MIGRATION PLAN

## **WHAT GETS REPLACED (DEPRECATION LIST)**

### **🗑️ HOOKS TO DELETE**
```typescript
// These hooks contain fragmented logic - will be replaced by useStockEngine
src/hooks/global/useDashboardConflicts.ts          // → useStockEngine.getConflicts()
src/hooks/global/useConsolidatedConflicts.ts       // → useStockEngine.getConflicts()  
src/hooks/equipment/useSubrentalSuggestions.ts     // → useStockEngine.getSuggestions()
src/hooks/project/useProjectConflicts.ts           // → useStockEngine scoped to project
src/components/planner/shared/utils/warningAnalysis.ts // → stockEngine.analyzeConflicts()
src/components/planner/shared/utils/folderWarnings.ts  // → stockEngine.getFolderSummary()
src/components/planner/shared/utils/crewWarnings.ts    // → Keep (crew different logic)
```

### **🔄 HOOKS TO REFACTOR**  
```typescript
// These hooks have mixed concerns - extract stock logic
src/components/planner/shared/hooks/useTimelineHub.ts
  ❌ Remove: warnings calculation, booking.isOverbooked logic
  ✅ Keep: UI state, formatting, resource grouping
  ✅ Add: useStockEngine integration

src/hooks/global/useGlobalSearch.ts
  ❌ Remove: conflict detection, stock calculations  
  ✅ Keep: Search logic, filtering
  ✅ Add: useStockEngine for equipment availability

src/hooks/equipment/useConfirmedSubrentals.ts
  ❌ Remove: Individual subrental logic
  ✅ Replace: With subrental orders system
```

### **🏗️ NEW ARCHITECTURE**

#### **Core Engine**
```typescript
src/hooks/stock/
  ├── useStockEngine.ts              // 🆕 Main engine
  ├── useSubrentalOrders.ts          // 🆕 Bundled orders management
  └── useVirtualStock.ts             // 🆕 Virtual stock calculations

src/services/stock/
  ├── stockCalculations.ts           // 🆕 Core calculation logic
  ├── conflictAnalysis.ts            // 🆕 Conflict detection
  ├── virtualStockEngine.ts          // 🆕 Virtual stock management
  └── subretalOrderEngine.ts         // 🆕 Order management

src/types/stock.ts                   // 🆕 Unified type definitions
```

#### **Database Schema**
```sql
-- 🆕 New Tables
subrental_orders                     // Master orders
subrental_order_items               // Equipment items in orders
repair_orders                       // Future: repair tracking
repair_order_items                  // Future: equipment in repairs

-- 🆕 Views for Performance  
equipment_effective_stock           // Pre-calculated virtual stock
equipment_daily_availability        // Daily availability summary

-- 🗑️ Tables to Remove (after migration)
confirmed_subrentals               // Replaced by subrental_orders system
```

## **MIGRATION PHASES**

### **Phase 1: Planning** (Current)
- [ ] Complete architecture documentation
- [ ] Create migration scripts
- [ ] Define rollback procedures
- [ ] Establish testing strategy

### **Phase 2: Core Engine** 
- [ ] Build stockCalculations.ts service
- [ ] Create useStockEngine hook
- [ ] Implement virtual stock logic
- [ ] Unit test all calculations

### **Phase 3: Database Migration**
- [ ] Create new schema migration
- [ ] Build data migration scripts  
- [ ] Create performance views
- [ ] Validate data integrity

### **Phase 4: Hook Integration**
- [ ] Replace useDashboardConflicts
- [ ] Refactor useTimelineHub
- [ ] Update useGlobalSearch
- [ ] Replace subrental hooks

### **Phase 5: UI Transformation**
- [ ] Create SubrentalOrderDialog
- [ ] Update timeline components
- [ ] Add stock breakdown displays
- [ ] Implement bundled workflows

### **Phase 6: Cleanup**
- [ ] Delete deprecated hooks
- [ ] Remove old database tables
- [ ] Update all documentation
- [ ] Performance optimization

## **CRITICAL SUCCESS FACTORS**

### **Data Integrity**
- ✅ All existing subrental data migrated accurately
- ✅ Stock calculations produce identical results during transition
- ✅ Zero conflicts after confirmed subrentals

### **Performance**
- ✅ Virtual stock calculations under 200ms for 30-day periods
- ✅ Timeline loading improved by 50%+
- ✅ Dashboard conflicts load under 500ms

### **User Experience**
- ✅ Bundled subrental workflow intuitive and faster
- ✅ Real-time conflict resolution visible
- ✅ Stock breakdown tooltips informative

### **Code Quality**
- ✅ Zero deprecated code remaining
- ✅ Single source of truth for stock calculations
- ✅ Comprehensive test coverage (90%+)

---

*Plan Status: Phase 1 - Planning*
*Next Milestone: Core Engine Implementation*
