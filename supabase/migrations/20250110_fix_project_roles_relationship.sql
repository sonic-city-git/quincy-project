-- Fix relationship between project_event_roles and project_roles
-- Add foreign key constraint to ensure data integrity

-- First, ensure project_roles table has the correct primary key
ALTER TABLE project_roles
DROP CONSTRAINT IF EXISTS project_roles_pkey CASCADE;

ALTER TABLE project_roles
ADD CONSTRAINT project_roles_pkey PRIMARY KEY (id);

-- Then, add the foreign key constraint to project_event_roles
ALTER TABLE project_event_roles
DROP CONSTRAINT IF EXISTS project_event_roles_role_id_fkey CASCADE;

ALTER TABLE project_event_roles
ADD CONSTRAINT project_event_roles_role_id_fkey 
FOREIGN KEY (role_id) 
REFERENCES project_roles(id)
ON DELETE CASCADE;

-- Create index to improve join performance
CREATE INDEX IF NOT EXISTS idx_project_event_roles_role_id
ON project_event_roles(role_id);

-- Create external_providers table for subrental functionality
CREATE TABLE IF NOT EXISTS external_providers (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name text NOT NULL,
    contact_email text,
    phone text,
    website text,
    geographic_coverage text[],
    reliability_rating numeric CHECK (reliability_rating >= 0 AND reliability_rating <= 5),
    preferred_status boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Add RLS policies for external_providers
ALTER TABLE external_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON external_providers
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON external_providers
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON external_providers
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Add some sample providers
INSERT INTO external_providers 
    (company_name, contact_email, phone, geographic_coverage, reliability_rating, preferred_status)
VALUES
    ('Oslo Equipment Rentals', 'contact@osloequipment.no', '+47 123 45 678', ARRAY['Oslo', 'Viken'], 4.8, true),
    ('Bergen Pro Audio', 'info@bergenproaudio.no', '+47 234 56 789', ARRAY['Bergen', 'Vestland'], 4.5, true),
    ('Trondheim Stage Gear', 'rental@trondheimstage.no', '+47 345 67 890', ARRAY['Trondheim', 'Trøndelag'], 4.2, false);
