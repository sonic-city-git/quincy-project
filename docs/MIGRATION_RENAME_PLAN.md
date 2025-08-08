# 🗄️ **MIGRATION TIMESTAMP FIX PLAN**

## **FUTURE-DATED MIGRATIONS TO RENAME**

**Current Issues**: Multiple migrations have future dates (2025) breaking chronological order

### **MIGRATIONS TO RENAME** (in chronological order)

```bash
# Current (BROKEN) → Proposed (FIXED)
20250109_fix_crew_price_calculation.sql    → 20240120_fix_crew_price_calculation.sql
20250109001_revert_crew_price_fix.sql      → 20240121_revert_crew_price_fix.sql  
20250109002_fix_schema_sync_issues.sql     → 20240122_fix_schema_sync_issues.sql
20250118_add_structured_location_data.sql  → 20240123_add_structured_location_data.sql
20250119_fix_sync_functions_variant_id.sql → 20240124_fix_sync_functions_variant_id.sql

# Variant system migrations (chronological order)
20250804170918_remote_commit.sql           → 20240125_remote_commit.sql
20250805183500_add_variant_columns.sql     → 20240126_add_variant_columns.sql
20250805183600_create_variant_config.sql   → 20240127_create_variant_config.sql
20250805183700_initialize_defaults.sql     → 20240128_initialize_defaults.sql
20250805183800_validate_migration.sql      → 20240129_validate_migration.sql
20250805184000_add_equipment_variant_column.sql → 20240130_add_equipment_variant_column.sql
20250806_add_event_variant_connection.sql  → 20240131_add_event_variant_connection.sql
20250807010924_simplify_variants_remove_display_name.sql → 20240201_simplify_variants_remove_display_name.sql
20250807011000_fix_variant_dependencies.sql → 20240202_fix_variant_dependencies.sql
20250807021000_fix_all_equipment_variants.sql → 20240203_fix_all_equipment_variants.sql
20250807025000_fix_variant_relationships_phase1.sql → 20240204_fix_variant_relationships_phase1.sql
20250807025100_update_sync_functions_use_variant_id.sql → 20240205_update_sync_functions_use_variant_id.sql
```

### **EXECUTION ORDER**
1. Rename crew/equipment sync related migrations first (these affect current sync issues)
2. Rename variant system migrations in dependency order
3. Update any references to old migration names in code/documentation

### **RISK ASSESSMENT**
- **LOW RISK**: These are file renames only, no content changes
- **NO PRODUCTION IMPACT**: Migration content unchanged
- **BENEFIT**: Restores proper chronological migration ordering
