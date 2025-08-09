-- Migration: Create confirmed_subrentals table for tracking booked subrentals
-- Description: Creates table to store confirmed subrental bookings
-- Author: Claude
-- Date: 2025-01-09

-- Create confirmed_subrentals table
CREATE TABLE IF NOT EXISTS confirmed_subrentals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id uuid NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    equipment_name text NOT NULL,
    provider_id uuid NOT NULL REFERENCES external_providers(id) ON DELETE RESTRICT,
    start_date date NOT NULL,
    end_date date NOT NULL,
    quantity integer NOT NULL CHECK (quantity > 0),
    cost numeric(10,2),
    temporary_serial text,
    notes text,
    status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'delivered', 'returned', 'cancelled')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Add RLS policies for confirmed_subrentals
ALTER TABLE confirmed_subrentals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON confirmed_subrentals
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON confirmed_subrentals
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON confirmed_subrentals
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON confirmed_subrentals
    FOR DELETE
    TO authenticated
    USING (true);

-- Create indexes for performance
CREATE INDEX idx_confirmed_subrentals_equipment_id ON confirmed_subrentals(equipment_id);
CREATE INDEX idx_confirmed_subrentals_provider_id ON confirmed_subrentals(provider_id);
CREATE INDEX idx_confirmed_subrentals_dates ON confirmed_subrentals(start_date, end_date);
CREATE INDEX idx_confirmed_subrentals_status ON confirmed_subrentals(status);

-- Add some sample data for testing
INSERT INTO confirmed_subrentals 
    (equipment_name, equipment_id, provider_id, start_date, end_date, quantity, cost, temporary_serial, notes, status)
SELECT 
    'Mixer CDM32',
    e.id,
    ep.id,
    '2025-01-15',
    '2025-01-20',
    2,
    1500.00,
    'Oslo Equipment MX1 #1',
    'Confirmed for Festival XYZ',
    'confirmed'
FROM equipment e, external_providers ep
WHERE e.name LIKE '%CDM32%' 
AND ep.company_name = 'Oslo Equipment Rentals'
LIMIT 1;
