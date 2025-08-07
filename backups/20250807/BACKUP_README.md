# QUINCY Database Backup - August 7, 2025

## 📋 Backup Summary

Created after completing the variant system overhaul and sync functionality implementation.

## 📁 Backup Files

### 1. Schema Backup (Structure Only)
**File:** `quincy_database_backup_20250807_011134.sql` (89KB, 3,047 lines)
- Database structure, tables, constraints, indexes
- Functions, triggers, and stored procedures
- No actual data

### 2. Data Backup (Data Only)  
**File:** `quincy_data_backup_20250807_011149.sql` (3.25MB, 13,004 lines)
- All table data (INSERT statements)
- ⚠️ Warning: Has circular foreign-key constraints on equipment_folders table
- Requires `--disable-triggers` for clean restore

### 3. Complete Backup (Alternative Data)
**File:** `quincy_complete_backup_20250807_011212.sql` (11,731 lines)
- Public schema data backup
- Alternative data export format

## 🔄 How to Restore

### Full Database Restore
```bash
# Option 1: Schema + Data (recommended)
psql $DATABASE_URL < quincy_database_backup_20250807_011134.sql
psql $DATABASE_URL < quincy_data_backup_20250807_011149.sql

# Option 2: For circular FK constraints issue
psql $DATABASE_URL -c "SET session_replication_role = replica;"
psql $DATABASE_URL < quincy_data_backup_20250807_011149.sql
psql $DATABASE_URL -c "SET session_replication_role = DEFAULT;"
```

### Using Supabase CLI
```bash
supabase db reset
# Then apply migrations
supabase db push
# Then restore data
psql $(supabase status | grep "DB URL" | cut -d'|' -f3 | xargs) < quincy_data_backup_20250807_011149.sql
```

## 🎯 What This Backup Contains

### Recent Changes Applied:
- ✅ Variant system consolidated to use only `variant_name` (no display_name)
- ✅ Event sync functionality fully implemented
- ✅ Database constraints relaxed for user-friendly variant names
- ✅ Default variants ensured for all projects
- ✅ Equipment and crew sync buttons working

### Key Tables Backed Up:
- `projects` - All project data
- `project_variants` - Simplified variant configurations  
- `project_events` - Events with variant connections
- `project_equipment` & `project_equipment_groups` - Equipment by variant
- `project_roles` - Crew roles by variant
- `crew_members` - All crew data
- `equipment` - All equipment inventory
- `customers` - Customer data
- And all supporting tables...

## 📊 Database Stats (at backup time):
- 38 total projects
- 11 projects with default variants  
- 27 projects missing default variants (warned in migration)
- Variant system fully functional with sync capabilities

## ⚠️ Important Notes:
1. The `equipment_folders` table has circular foreign-key constraints
2. For clean restores, use `--disable-triggers` or `SET session_replication_role = replica`
3. All recent variant and sync functionality changes are included
4. This backup was created immediately after pushing all changes to remote database

## 🔗 Related Commits:
- Last commit: `47e735d9` - "feat: Complete variant system overhaul and sync functionality"
- Branch: `feature/project-detail-pages-transformation`