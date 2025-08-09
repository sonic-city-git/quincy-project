-- =====================================================================================
-- PRE-MIGRATION VALIDATION SCRIPT
-- =====================================================================================
-- Validates current system state before unified stock migration
-- Run this BEFORE applying the new schema migration

-- =====================================================================================
-- SYSTEM STATE VALIDATION
-- =====================================================================================

DO $$
DECLARE
    confirmed_count integer;
    provider_count integer;
    equipment_count integer;
    total_cost numeric;
    date_range_check integer;
BEGIN
    RAISE NOTICE '🔍 STARTING PRE-MIGRATION VALIDATION';
    RAISE NOTICE '==========================================';
    
    -- Check 1: Current confirmed_subrentals data
    SELECT COUNT(*), COALESCE(SUM(cost), 0) 
    INTO confirmed_count, total_cost 
    FROM confirmed_subrentals;
    
    RAISE NOTICE '📊 Current confirmed_subrentals: % records, $% total cost', 
        confirmed_count, total_cost;
    
    -- Check 2: External providers exist
    SELECT COUNT(*) INTO provider_count FROM external_providers;
    RAISE NOTICE '🏢 External providers available: %', provider_count;
    
    -- Check 3: Equipment references are valid
    SELECT COUNT(DISTINCT cs.equipment_id) 
    INTO equipment_count 
    FROM confirmed_subrentals cs
    INNER JOIN equipment e ON cs.equipment_id = e.id;
    
    RAISE NOTICE '📦 Equipment with valid references: %', equipment_count;
    
    -- Check 4: Date range validation
    SELECT COUNT(*) 
    INTO date_range_check 
    FROM confirmed_subrentals 
    WHERE start_date > end_date OR start_date < '2020-01-01' OR end_date > '2030-12-31';
    
    IF date_range_check > 0 THEN
        RAISE WARNING '⚠️  Found % records with invalid date ranges', date_range_check;
    ELSE
        RAISE NOTICE '✅ All date ranges are valid';
    END IF;
    
    -- Check 5: Orphaned records
    SELECT COUNT(*)
    INTO confirmed_count
    FROM confirmed_subrentals cs
    LEFT JOIN external_providers ep ON cs.provider_id = ep.id
    WHERE ep.id IS NULL;
    
    IF confirmed_count > 0 THEN
        RAISE WARNING '⚠️  Found % subrentals with invalid provider references', confirmed_count;
    ELSE
        RAISE NOTICE '✅ All provider references are valid';
    END IF;
    
    RAISE NOTICE '==========================================';
    RAISE NOTICE '✅ PRE-MIGRATION VALIDATION COMPLETE';
    
END $$;

-- =====================================================================================
-- DATA INTEGRITY CHECKS
-- =====================================================================================

-- Create validation results table for tracking
CREATE TABLE IF NOT EXISTS migration_validation_log (
    id SERIAL PRIMARY KEY,
    check_name TEXT NOT NULL,
    check_result BOOLEAN NOT NULL,
    details TEXT,
    record_count INTEGER,
    total_amount NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clear previous validation results
DELETE FROM migration_validation_log WHERE created_at < NOW() - INTERVAL '1 hour';

-- Insert validation results
INSERT INTO migration_validation_log (check_name, check_result, details, record_count, total_amount)
SELECT 
    'confirmed_subrentals_count',
    COUNT(*) > 0,
    'Total confirmed subrental records',
    COUNT(*),
    COALESCE(SUM(cost), 0)
FROM confirmed_subrentals;

INSERT INTO migration_validation_log (check_name, check_result, details, record_count)
SELECT 
    'external_providers_available',
    COUNT(*) > 0,
    'External providers for subrental operations',
    COUNT(*)
FROM external_providers;

INSERT INTO migration_validation_log (check_name, check_result, details, record_count)
SELECT 
    'valid_equipment_references',
    COUNT(*) = (SELECT COUNT(*) FROM confirmed_subrentals),
    'Confirmed subrentals with valid equipment references',
    COUNT(*)
FROM confirmed_subrentals cs
INNER JOIN equipment e ON cs.equipment_id = e.id;

INSERT INTO migration_validation_log (check_name, check_result, details, record_count)
SELECT 
    'valid_provider_references',
    COUNT(*) = (SELECT COUNT(*) FROM confirmed_subrentals),
    'Confirmed subrentals with valid provider references',
    COUNT(*)
FROM confirmed_subrentals cs
INNER JOIN external_providers ep ON cs.provider_id = ep.id;

-- =====================================================================================
-- BACKUP PREPARATION
-- =====================================================================================

-- Create backup of current data (for emergency rollback)
CREATE TABLE IF NOT EXISTS confirmed_subrentals_backup_20250117 AS 
SELECT * FROM confirmed_subrentals;

-- Verify backup
DO $$
DECLARE
    original_count integer;
    backup_count integer;
BEGIN
    SELECT COUNT(*) INTO original_count FROM confirmed_subrentals;
    SELECT COUNT(*) INTO backup_count FROM confirmed_subrentals_backup_20250117;
    
    IF original_count = backup_count THEN
        RAISE NOTICE '✅ Backup created successfully: % records', backup_count;
    ELSE
        RAISE EXCEPTION 'Backup failed: original=%, backup=%', original_count, backup_count;
    END IF;
END $$;

-- =====================================================================================
-- FINAL VALIDATION REPORT
-- =====================================================================================

SELECT 
    check_name,
    CASE WHEN check_result THEN '✅ PASS' ELSE '❌ FAIL' END as status,
    details,
    record_count,
    total_amount
FROM migration_validation_log 
WHERE created_at > NOW() - INTERVAL '5 minutes'
ORDER BY id;

RAISE NOTICE '🚀 SYSTEM READY FOR MIGRATION - Review validation results above';
