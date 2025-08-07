-- Fix the event variant constraint manually
-- Drop the old restrictive constraint
ALTER TABLE project_events DROP CONSTRAINT IF EXISTS valid_event_variant;

-- Add the new simple constraint that allows user-friendly names
ALTER TABLE project_events
ADD CONSTRAINT simple_event_variant 
CHECK (char_length(variant_name) >= 1 AND char_length(variant_name) <= 50);

-- Verify the change
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE table_name = 'project_events' 
AND constraint_name LIKE '%variant%';