# 📊 VIRTUAL STOCK CALCULATION SPECIFICATION

## **OVERVIEW**
Detailed specification for virtual stock calculations that include subrental additions and repair reductions.

## **CORE FORMULA**

```typescript
effectiveStock(equipmentId: string, date: string): number {
  const baseStock = equipment.stock;
  const subrentalAdditions = getSubrentalStock(equipmentId, date);
  const repairReductions = getRepairStock(equipmentId, date); // Future
  
  return baseStock + subrentalAdditions - repairReductions;
}
```

## **SUBRENTAL STOCK CALCULATION**

### **SQL Query**
```sql
-- Get subrental stock for specific equipment on specific date
SELECT COALESCE(SUM(soi.quantity), 0) as virtual_stock
FROM subrental_order_items soi
JOIN subrental_orders so ON soi.subrental_order_id = so.id
WHERE soi.equipment_id = $1
  AND so.start_date <= $2
  AND so.end_date >= $2
  AND so.status IN ('confirmed', 'delivered');
```

### **Caching Strategy**
```typescript
// Cache virtual stock by equipment per day
interface VirtualStockCache {
  [equipmentId: string]: {
    [dateString: string]: {
      subrentalStock: number;
      repairReduction: number;
      calculatedAt: Date;
    }
  }
}

// Invalidate cache when:
// - Subrental orders created/updated/deleted
// - Repair orders created/updated/deleted
// - Equipment stock changed
```

## **INTEGRATION POINTS**

### **Timeline Hub**
```typescript
// Update useTimelineHub.ts
const processedBooking = {
  ...booking,
  effectiveStock: await calculateEffectiveStock(booking.resourceId, booking.date),
  virtualStock: await getVirtualStock(booking.resourceId, booking.date),
  baseStock: resource.stock,
  isOverbooked: booking.totalUsed > effectiveStock
};
```

### **Dashboard Conflicts**
```typescript
// Update useDashboardConflicts.ts
const conflicts = bookingsByEquipmentAndDate
  .filter(async (booking) => {
    const effectiveStock = await calculateEffectiveStock(
      booking.equipment.id, 
      booking.date
    );
    return booking.totalUsed > effectiveStock;
  });
```

### **Global Search**
```typescript
// Update useGlobalSearch.ts
const equipmentWithVirtualStock = await Promise.all(
  equipment.map(async (item) => ({
    ...item,
    effectiveStock: await calculateEffectiveStock(item.id, searchDate),
    virtualStockInfo: await getVirtualStockBreakdown(item.id, searchDate)
  }))
);
```

## **PERFORMANCE CONSIDERATIONS**

### **Database Indexes**
```sql
-- Critical indexes for virtual stock queries
CREATE INDEX idx_subrental_orders_date_status 
ON subrental_orders(start_date, end_date, status);

CREATE INDEX idx_subrental_order_items_equipment_date 
ON subrental_order_items(equipment_id);

-- Composite index for common queries
CREATE INDEX idx_virtual_stock_lookup 
ON subrental_order_items(equipment_id) 
INCLUDE (quantity);
```

### **Query Optimization**
```sql
-- Batch virtual stock calculation for multiple equipment/dates
WITH date_range AS (
  SELECT generate_series($1::date, $2::date, '1 day'::interval)::date as calc_date
),
equipment_list AS (
  SELECT unnest($3::uuid[]) as equipment_id
)
SELECT 
  el.equipment_id,
  dr.calc_date,
  COALESCE(SUM(soi.quantity), 0) as virtual_stock
FROM equipment_list el
CROSS JOIN date_range dr
LEFT JOIN subrental_order_items soi ON soi.equipment_id = el.equipment_id
LEFT JOIN subrental_orders so ON soi.subrental_order_id = so.id
  AND so.start_date <= dr.calc_date
  AND so.end_date >= dr.calc_date
  AND so.status IN ('confirmed', 'delivered')
GROUP BY el.equipment_id, dr.calc_date;
```

## **TESTING STRATEGY**

### **Unit Tests**
```typescript
describe('Virtual Stock Calculation', () => {
  test('should add subrental stock to base stock', async () => {
    // Base stock: 5, Subrental: +3 = Effective: 8
  });
  
  test('should handle overlapping subrental periods', async () => {
    // Multiple subrentals on same date should sum correctly
  });
  
  test('should exclude cancelled subrentals', async () => {
    // Only confirmed/delivered should count
  });
});
```

### **Integration Tests**
```typescript
describe('Stock Integration', () => {
  test('timeline shows correct availability after subrental', async () => {
    // Create overbooking, add subrental, verify conflict resolved
  });
  
  test('dashboard conflicts update with virtual stock', async () => {
    // Ensure conflict detection uses effective stock
  });
});
```

## **MIGRATION IMPACT**

### **Before Migration**
```typescript
// Current stock check (broken)
const isOverbooked = booking.totalUsed > equipment.stock;
```

### **After Migration**
```typescript
// New stock check (with virtual stock)
const effectiveStock = await calculateEffectiveStock(equipment.id, date);
const isOverbooked = booking.totalUsed > effectiveStock;
```

---

*Status: Specification Complete*
*Implementation: Phase 3*
