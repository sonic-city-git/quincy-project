-- Find all orphaned records in the QUINCY database
-- Run this in your remote Supabase SQL editor

-- 1. Equipment records with NULL or invalid variant_id
SELECT 
  'ORPHANED EQUIPMENT - No Variant' as issue_type,
  pe.id,
  pe.project_id,
  pe.variant_id,
  pe.equipment_id,
  e.name as equipment_name,
  pe.created_at
FROM project_equipment pe
LEFT JOIN equipment e ON pe.equipment_id = e.id
LEFT JOIN project_variants pv ON pe.variant_id = pv.id
WHERE pe.variant_id IS NULL OR pv.id IS NULL;

-- 2. Equipment records with NULL or invalid group_id (when group_id is expected)
SELECT 
  'ORPHANED EQUIPMENT - No Group' as issue_type,
  pe.id,
  pe.project_id,
  pe.variant_id,
  pe.group_id,
  pe.equipment_id,
  e.name as equipment_name,
  pe.created_at
FROM project_equipment pe
LEFT JOIN equipment e ON pe.equipment_id = e.id
LEFT JOIN project_equipment_groups peg ON pe.group_id = peg.id
WHERE pe.group_id IS NOT NULL AND peg.id IS NULL;

-- 3. Equipment groups with NULL or invalid variant_id
SELECT 
  'ORPHANED GROUPS - No Variant' as issue_type,
  peg.id,
  peg.project_id,
  peg.name as group_name,
  peg.variant_id,
  peg.created_at
FROM project_equipment_groups peg
LEFT JOIN project_variants pv ON peg.variant_id = pv.id
WHERE peg.variant_id IS NULL OR pv.id IS NULL;

-- 4. Equipment pointing to groups in different projects (data integrity issue)
SELECT 
  'CROSS-PROJECT REFERENCE' as issue_type,
  pe.id,
  pe.project_id as equipment_project,
  peg.project_id as group_project,
  pe.equipment_id,
  e.name as equipment_name,
  peg.name as group_name
FROM project_equipment pe
JOIN project_equipment_groups peg ON pe.group_id = peg.id
LEFT JOIN equipment e ON pe.equipment_id = e.id
WHERE pe.project_id != peg.project_id;

-- 5. Equipment pointing to groups in different variants (data integrity issue)
SELECT 
  'CROSS-VARIANT REFERENCE' as issue_type,
  pe.id,
  pe.project_id,
  pe.variant_id as equipment_variant,
  peg.variant_id as group_variant,
  pe.equipment_id,
  e.name as equipment_name,
  peg.name as group_name
FROM project_equipment pe
JOIN project_equipment_groups peg ON pe.group_id = peg.id
LEFT JOIN equipment e ON pe.equipment_id = e.id
WHERE pe.variant_id != peg.variant_id;

-- Summary counts of all issues
SELECT 
  issue_type,
  COUNT(*) as count
FROM (
  -- Equipment with no variant
  SELECT 'Equipment with no/invalid variant' as issue_type
  FROM project_equipment pe
  LEFT JOIN project_variants pv ON pe.variant_id = pv.id
  WHERE pe.variant_id IS NULL OR pv.id IS NULL
  
  UNION ALL
  
  -- Equipment with no group (when group_id is set)
  SELECT 'Equipment with invalid group' as issue_type
  FROM project_equipment pe
  LEFT JOIN project_equipment_groups peg ON pe.group_id = peg.id
  WHERE pe.group_id IS NOT NULL AND peg.id IS NULL
  
  UNION ALL
  
  -- Groups with no variant
  SELECT 'Groups with no/invalid variant' as issue_type
  FROM project_equipment_groups peg
  LEFT JOIN project_variants pv ON peg.variant_id = pv.id
  WHERE peg.variant_id IS NULL OR pv.id IS NULL
  
  UNION ALL
  
  -- Cross-project references
  SELECT 'Cross-project references' as issue_type
  FROM project_equipment pe
  JOIN project_equipment_groups peg ON pe.group_id = peg.id
  WHERE pe.project_id != peg.project_id
  
  UNION ALL
  
  -- Cross-variant references
  SELECT 'Cross-variant references' as issue_type
  FROM project_equipment pe
  JOIN project_equipment_groups peg ON pe.group_id = peg.id
  WHERE pe.variant_id != peg.variant_id
) issues
GROUP BY issue_type
ORDER BY count DESC;