# 🗄️ DATABASE MIGRATION STRATEGY

## **MIGRATION OVERVIEW**
Safe, incremental migration from individual `confirmed_subrentals` to bundled `subrental_orders` system.

## **MIGRATION PHASES**

### **Phase 2A: Create New Schema**
```sql
-- New tables with proper constraints
CREATE TABLE subrental_orders (...)
CREATE TABLE subrental_order_items (...)

-- Indexes for performance
CREATE INDEX idx_subrental_orders_dates ON subrental_orders(start_date, end_date);
CREATE INDEX idx_subrental_order_items_equipment ON subrental_order_items(equipment_id);
```

### **Phase 2B: Data Migration**
```sql
-- Convert existing confirmed_subrentals to orders
-- Strategy: Group by provider + date range to create logical orders
INSERT INTO subrental_orders (name, provider_id, start_date, end_date, ...)
SELECT 
    CONCAT(ep.company_name, ' - ', cs.start_date) as name,
    cs.provider_id,
    cs.start_date,
    cs.end_date,
    SUM(cs.cost) as total_cost,
    'confirmed' as status
FROM confirmed_subrentals cs
JOIN external_providers ep ON cs.provider_id = ep.id
GROUP BY cs.provider_id, cs.start_date, cs.end_date, ep.company_name;

-- Convert individual items
INSERT INTO subrental_order_items (...)
-- Link to appropriate orders based on grouping logic
```

### **Phase 2C: Validation & Cleanup**
```sql
-- Validation queries
SELECT COUNT(*) FROM confirmed_subrentals; -- Original count
SELECT COUNT(*) FROM subrental_order_items; -- Should match
SELECT SUM(cost) FROM confirmed_subrentals; -- Original total cost
SELECT SUM(unit_cost * quantity) FROM subrental_order_items; -- Should match

-- After validation: DROP TABLE confirmed_subrentals;
```

## **ROLLBACK STRATEGY**
```sql
-- Emergency rollback script
-- Recreate confirmed_subrentals from subrental_order_items
CREATE TABLE confirmed_subrentals_backup AS 
SELECT 
    soi.id,
    soi.equipment_id,
    soi.equipment_name,
    so.provider_id,
    so.start_date,
    so.end_date,
    soi.quantity,
    soi.unit_cost as cost,
    soi.temporary_serial,
    so.notes,
    so.status,
    so.created_at
FROM subrental_order_items soi
JOIN subrental_orders so ON soi.subrental_order_id = so.id;
```

## **VALIDATION CHECKLIST**
- [ ] All original data preserved
- [ ] Cost totals match exactly
- [ ] Provider relationships intact
- [ ] Date ranges preserved
- [ ] Status mappings correct
- [ ] Performance tests pass
- [ ] UI still functions with new schema

---

*Migration Status: Planning Phase*
