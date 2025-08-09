-- ============================================================================
-- DATABASE STATE DISCOVERY QUERIES
-- Execute these to understand current production state
-- ============================================================================

-- 1. Check which sync functions currently exist
SELECT 
  routine_name,
  routine_type,
  data_type as return_type,
  routine_definition IS NOT NULL as has_definition
FROM information_schema.routines 
WHERE routine_name LIKE 'sync_event_%'
ORDER BY routine_name;

-- 2. Check function parameters for each sync function
SELECT 
  r.routine_name,
  p.parameter_name,
  p.data_type,
  p.parameter_mode,
  p.ordinal_position
FROM information_schema.routines r
LEFT JOIN information_schema.parameters p ON r.specific_name = p.specific_name
WHERE r.routine_name LIKE 'sync_event_%'
ORDER BY r.routine_name, p.ordinal_position;

-- 3. Check if is_synced column exists in project_event_roles
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'project_event_roles'
  AND column_name = 'is_synced';

-- 4. Check if is_synced column exists in project_event_equipment  
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'project_event_equipment'
  AND column_name = 'is_synced';

-- 5. Check variant relationship integrity
SELECT 
  COUNT(*) as total_events,
  COUNT(variant_id) as events_with_variant,
  COUNT(*) - COUNT(variant_id) as orphaned_events
FROM project_events;

-- 6. Check project_variants table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'project_variants'
ORDER BY ordinal_position;

-- 7. Check for migration tracking table
SELECT 
  EXISTS(
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'supabase_migrations' 
    AND table_name = 'schema_migrations'
  ) as has_migration_tracking;
