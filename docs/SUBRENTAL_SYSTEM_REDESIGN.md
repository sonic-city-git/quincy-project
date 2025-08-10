# 🎯 QUINCY SUBRENTAL SYSTEM REDESIGN

## **OVERVIEW**
Complete architectural transformation from individual equipment subrentals to bundled order management with virtual stock capabilities.

## **BUSINESS REQUIREMENTS**

### **Current Problems**
1. **Fragmented Operations**: Users create individual subrental confirmations per equipment
2. **No Stock Impact**: Confirmed subrentals don't affect availability calculations
3. **Limited Bundling**: Cannot group multiple equipment from same provider
4. **Conflict Persistence**: Overbookings remain after subrental confirmation

### **Target Solution** 
1. **Bundled Orders**: Single subrental order contains multiple equipment items
2. **Virtual Stock**: Subrentals add temporary stock, resolving conflicts
3. **Provider Grouping**: Multiple equipment from same supplier in one order
4. **Future-Ready**: Foundation for repair orders (temporary stock reduction)

## **TECHNICAL ARCHITECTURE**

### **Database Schema Changes**

#### **New Tables**
```sql
-- Master subrental orders
subrental_orders {
  id: uuid PRIMARY KEY
  name: text NOT NULL                    -- "Festival Audio - Oslo Equipment"
  provider_id: uuid → external_providers
  start_date: date
  end_date: date
  total_cost: numeric(10,2)
  status: enum('confirmed', 'delivered', 'returned', 'cancelled')
  notes: text
  created_at/updated_at: timestamptz
}

-- Individual equipment items within orders
subrental_order_items {
  id: uuid PRIMARY KEY
  subrental_order_id: uuid → subrental_orders
  equipment_id: uuid → equipment
  equipment_name: text                   -- Denormalized for history
  quantity: integer
  unit_cost: numeric(10,2)
  temporary_serial: text                 -- "Oslo Equipment MX1 #1"
  notes: text
}
```

#### **Deprecated Tables**
- `confirmed_subrentals` → Will be migrated and removed

### **Stock Calculation Logic**

#### **Current (Broken)**
```typescript
effectiveStock = baseStock
isOverbooked = totalUsed > baseStock
```

#### **New (Virtual Stock)**
```typescript
effectiveStock = baseStock + virtualSubrentalStock - virtualRepairReduction
isOverbooked = totalUsed > effectiveStock

// Virtual stock calculation per equipment per date
virtualSubrentalStock = SUM(subrental_order_items.quantity) 
  WHERE equipment_id = X 
  AND start_date <= date 
  AND end_date >= date
  AND status IN ('confirmed', 'delivered')
```

### **User Experience Flow**

#### **Current Flow**
```
Overbooking → Individual Suggestions → Individual Confirmations → Conflicts Persist
```

#### **New Flow**
```
Overbooking → Line-by-Line Suggestions → Bundled Order Creation → Virtual Stock Addition → Conflicts Resolved
```

## **IMPLEMENTATION PHASES**

### **Phase 1: Planning & Documentation** ✅
- ✅ Architecture documentation
- ✅ Database design  
- ✅ Migration strategy
- ✅ Rollback procedures
- ✅ Core type definitions

### **Phase 2: Database Migration**
- Create new schema
- Data migration utilities
- Validation scripts
- Rollback procedures

### **Phase 3: Virtual Stock System**
- Stock calculation functions
- Booking validation logic
- Timeline data integration
- Performance optimization

### **Phase 4: Bundled Order UI**
- Order creation dialogs
- Timeline visualization
- Stock display updates
- User workflow implementation

### **Phase 5: Cleanup & Testing**
- Remove deprecated code
- Comprehensive testing
- Performance validation
- Documentation updates

### **Phase 6: Repairs Foundation**
- Repair orders schema
- Stock reduction logic
- UI components
- Workflow integration

## **SUCCESS METRICS**
- ✅ Zero overbooking conflicts after subrental confirmation
- ✅ Bundled orders reduce operational overhead by 60%
- ✅ Stock calculations include virtual additions in real-time
- ✅ Clean codebase with zero deprecated subrental code
- ✅ Foundation ready for repairs system

## **RISK MITIGATION**
- **Data Loss**: Full backup before each migration step
- **Downtime**: Incremental deployment with feature flags
- **Performance**: Load testing with virtual stock calculations
- **User Adoption**: Gradual UI transition with training materials

---

*Last Updated: 2025-01-17*
*Next Review: After Phase 2 completion*
