-- Migration: Create project variants configuration table
-- This table stores variant definitions and metadata

CREATE TABLE IF NOT EXISTS project_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    variant_name TEXT NOT NULL,
    display_name TEXT NOT NULL, -- User-friendly name: "Trio", "Band", "DJ"
    description TEXT,           -- Optional description
    is_default BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique variant names per project
    CONSTRAINT unique_project_variant UNIQUE(project_id, variant_name),
    
    -- Variant names must be valid identifiers (lowercase, alphanumeric, underscores)
    CONSTRAINT valid_variant_name 
    CHECK (variant_name ~ '^[a-z0-9_]+$' AND char_length(variant_name) >= 1 AND char_length(variant_name) <= 50),
    
    -- Display names must be reasonable length
    CONSTRAINT valid_display_name
    CHECK (char_length(display_name) >= 1 AND char_length(display_name) <= 100),
    
    -- Sort order must be non-negative
    CONSTRAINT valid_sort_order
    CHECK (sort_order >= 0)
);

-- Only one default variant per project (partial unique index)
CREATE UNIQUE INDEX IF NOT EXISTS idx_project_variants_unique_default
ON project_variants(project_id) WHERE is_default = true;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_variants_project 
ON project_variants(project_id);

CREATE INDEX IF NOT EXISTS idx_project_variants_project_sort 
ON project_variants(project_id, sort_order);

-- Enable RLS for security
ALTER TABLE project_variants ENABLE ROW LEVEL SECURITY;

-- RLS policies (inherit from projects table security)
DO $$
BEGIN
    -- Create SELECT policy if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'project_variants' 
        AND policyname = 'Users can view project variants they have access to'
    ) THEN
        CREATE POLICY "Users can view project variants they have access to"
        ON project_variants FOR SELECT
        USING (
            project_id IN (
                SELECT id FROM projects
                -- Project access is controlled by existing RLS policies
            )
        );
    END IF;
    
    -- Create ALL policy if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'project_variants' 
        AND policyname = 'Users can modify project variants they have access to'
    ) THEN
        CREATE POLICY "Users can modify project variants they have access to"
        ON project_variants FOR ALL
        USING (
            project_id IN (
                SELECT id FROM projects
                -- Project access is controlled by existing RLS policies
            )
        );
    END IF;
END $$;

-- Add helpful comments
COMMENT ON TABLE project_variants IS 'Configuration for project performance variants (e.g., Trio, Band, DJ setups)';
COMMENT ON COLUMN project_variants.variant_name IS 'Internal identifier for variant (lowercase, alphanumeric)';
COMMENT ON COLUMN project_variants.display_name IS 'User-friendly name shown in UI';
COMMENT ON COLUMN project_variants.is_default IS 'Whether this is the default variant for the project';
COMMENT ON COLUMN project_variants.sort_order IS 'Display order in UI (lower numbers first)';

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_project_variants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    -- Create trigger if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_project_variants_updated_at'
    ) THEN
        CREATE TRIGGER update_project_variants_updated_at
            BEFORE UPDATE ON project_variants
            FOR EACH ROW
            EXECUTE FUNCTION update_project_variants_updated_at();
    END IF;
END $$;

-- Final success notice
DO $$
BEGIN
    RAISE NOTICE 'Project variants table created successfully with constraints and security policies.';
END $$;