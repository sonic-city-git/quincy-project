-- Migration: Create external_providers table for subrental functionality
-- Description: Creates the external_providers table that was missing from previous migration
-- Author: Claude
-- Date: 2025-08-09

-- Create external_providers table for subrental functionality
CREATE TABLE IF NOT EXISTS external_providers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Create policies for external_providers
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Enable read access for authenticated users" ON external_providers;
    DROP POLICY IF EXISTS "Enable insert for authenticated users" ON external_providers;
    DROP POLICY IF EXISTS "Enable update for authenticated users" ON external_providers;
    DROP POLICY IF EXISTS "Enable delete for authenticated users" ON external_providers;

    -- Create new policies
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

    CREATE POLICY "Enable delete for authenticated users" ON external_providers
        FOR DELETE
        TO authenticated
        USING (true);
END $$;

-- Add some sample providers (only if table is empty)
INSERT INTO external_providers 
    (company_name, contact_email, phone, geographic_coverage, reliability_rating, preferred_status)
SELECT * FROM (VALUES
    ('Oslo Equipment Rentals', 'contact@osloequipment.no', '+47 123 45 678', ARRAY['Oslo', 'Viken'], 4.8, true),
    ('Bergen Pro Audio', 'info@bergenproaudio.no', '+47 234 56 789', ARRAY['Bergen', 'Vestland'], 4.5, true),
    ('Trondheim Stage Gear', 'rental@trondheimstage.no', '+47 345 67 890', ARRAY['Trondheim', 'Trøndelag'], 4.2, false),
    ('Stavanger Sound Systems', 'service@stavangersound.no', '+47 456 78 901', ARRAY['Stavanger', 'Rogaland'], 4.6, true),
    ('Tromsø Arctic Audio', 'arctic@tromsoaudio.no', '+47 567 89 012', ARRAY['Tromsø', 'Troms og Finnmark'], 4.1, false)
) AS new_providers(company_name, contact_email, phone, geographic_coverage, reliability_rating, preferred_status)
WHERE NOT EXISTS (SELECT 1 FROM external_providers LIMIT 1);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_external_providers_preferred_status 
ON external_providers(preferred_status);

CREATE INDEX IF NOT EXISTS idx_external_providers_reliability_rating 
ON external_providers(reliability_rating);

CREATE INDEX IF NOT EXISTS idx_external_providers_geographic_coverage 
ON external_providers USING GIN(geographic_coverage);

-- Verify the table was created successfully
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'external_providers'
    ) THEN
        RAISE EXCEPTION 'Failed to create external_providers table';
    END IF;
    
    RAISE NOTICE 'external_providers table created successfully';
END $$;
