-- Make location field required for events
-- First, update any existing events without locations

-- Check for events without locations and update them with a default
UPDATE project_events 
SET location = 'Location TBD' 
WHERE location IS NULL OR location = '';

-- Now make the column NOT NULL
ALTER TABLE project_events 
ALTER COLUMN location SET NOT NULL;

-- Add a check constraint to prevent empty strings
ALTER TABLE project_events
ADD CONSTRAINT location_not_empty CHECK (length(trim(location)) > 0);

-- Comment to explain the change
COMMENT ON COLUMN project_events.location IS 'Event location - required field for all events as of 2025-01-18';
