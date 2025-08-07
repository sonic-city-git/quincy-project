-- Add structured location data for analytics
-- This allows storing rich city information while keeping the existing location field for display

-- Add a JSON column for structured location data
ALTER TABLE project_events 
ADD COLUMN IF NOT EXISTS location_data JSONB;

-- Add index for JSON queries on location data
CREATE INDEX IF NOT EXISTS idx_project_events_location_data_city 
ON project_events USING GIN ((location_data->'city'));

CREATE INDEX IF NOT EXISTS idx_project_events_location_data_country 
ON project_events USING GIN ((location_data->'country'));

-- Add constraint to validate location_data structure when present
ALTER TABLE project_events
ADD CONSTRAINT valid_location_data 
CHECK (
  location_data IS NULL OR (
    location_data ? 'displayName' AND 
    location_data ? 'city' AND 
    location_data ? 'country' AND
    location_data ? 'placeId'
  )
);

-- Comment explaining the new column
COMMENT ON COLUMN project_events.location_data IS 'Structured location data from Google Places API for analytics. Contains city, country, coordinates, placeId, etc.';
COMMENT ON COLUMN project_events.location IS 'Display name for location (required). Used for UI display and backward compatibility.';