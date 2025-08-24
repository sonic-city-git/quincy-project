-- =====================================================================================
-- QUINCY INVOICE SYSTEM - CORE TABLES ONLY
-- =====================================================================================
-- Migration: Create invoice management system for Fiken integration (core tables only)
-- Description: Project-level invoice drafts with automatic event collection
-- Author: Systems Engineer  
-- Date: 2025-01-14

-- =====================================================================================
-- MAIN INVOICE TABLES
-- =====================================================================================

-- Main invoices table (follows QUINCY naming conventions)
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Auto-draft system
  is_auto_draft boolean DEFAULT false,
  invoice_type text DEFAULT 'standard' CHECK (invoice_type IN ('standard', 'credit_note', 'auto_draft')),
  
  -- Fiken integration
  fiken_invoice_id text,
  fiken_invoice_number text,
  fiken_url text,
  
  -- Status tracking (using CHECK constraint like other QUINCY tables)
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'created_in_fiken', 'sent', 'paid', 'overdue', 'cancelled')),
  
  -- Financial data (using numeric(10,2) like existing tables)
  subtotal_amount numeric(10,2) DEFAULT 0,
  tax_amount numeric(10,2) DEFAULT 0,
  total_amount numeric(10,2) DEFAULT 0,
  
  -- Dates
  invoice_date date DEFAULT CURRENT_DATE,
  due_date date DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  sent_date date,
  paid_date date,
  
  -- Sync tracking
  fiken_created_at timestamptz,
  last_synced_at timestamptz,
  
  -- Standard QUINCY timestamps
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  
  -- Constraints following QUINCY patterns
  CONSTRAINT valid_due_date CHECK (due_date >= invoice_date),
  CONSTRAINT valid_amounts CHECK (
    subtotal_amount >= 0 AND 
    tax_amount >= 0 AND 
    total_amount >= 0
  )
);

-- Invoice line items (for detailed breakdown and Fiken sync)
CREATE TABLE IF NOT EXISTS invoice_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  
  -- Fiken sync
  fiken_line_id text,
  
  -- Line item data
  description text NOT NULL,
  quantity numeric(10,2) DEFAULT 1,
  unit_price numeric(10,2) NOT NULL,
  line_total numeric(10,2) NOT NULL,
  
  -- Tax handling (Norwegian VAT)
  vat_type text DEFAULT 'HIGH' CHECK (vat_type IN ('HIGH', 'MEDIUM', 'LOW', 'EXEMPT')),
  vat_rate numeric(5,2) DEFAULT 25.00,
  vat_amount numeric(10,2) DEFAULT 0,
  
  -- Source tracking
  source_type text NOT NULL CHECK (source_type IN ('event_crew', 'event_equipment', 'manual_expense', 'fiken_added')),
  source_id uuid, -- References project_events.id if applicable
  
  -- Display
  sort_order integer DEFAULT 0,
  is_editable boolean DEFAULT true,
  
  -- Standard QUINCY timestamps
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_quantity CHECK (quantity > 0),
  CONSTRAINT valid_unit_price CHECK (unit_price >= 0),
  CONSTRAINT valid_line_total CHECK (line_total >= 0),
  CONSTRAINT valid_vat_rate CHECK (vat_rate >= 0 AND vat_rate <= 100),
  CONSTRAINT valid_vat_amount CHECK (vat_amount >= 0)
);

-- Event-to-invoice linking
CREATE TABLE IF NOT EXISTS invoice_event_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES project_events(id) ON DELETE CASCADE,
  
  -- Track what was included from this event
  included_crew boolean DEFAULT false,
  included_equipment boolean DEFAULT false,
  crew_line_item_id uuid REFERENCES invoice_line_items(id),
  equipment_line_item_id uuid REFERENCES invoice_line_items(id),
  
  created_at timestamptz DEFAULT NOW(),
  
  -- Prevent duplicate event-invoice links
  UNIQUE(invoice_id, event_id)
);

-- =====================================================================================
-- CUSTOMER FIKEN INTEGRATION
-- =====================================================================================

-- Add Fiken customer ID to existing customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS fiken_customer_id text;

-- =====================================================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================================================

-- Invoice indexes
CREATE INDEX IF NOT EXISTS idx_invoices_project_id ON invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_invoices_fiken_id ON invoices(fiken_invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_auto_draft ON invoices(project_id, is_auto_draft, status);

-- Line item indexes
CREATE INDEX IF NOT EXISTS idx_invoice_lines_invoice_id ON invoice_line_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_lines_source ON invoice_line_items(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_invoice_lines_fiken_id ON invoice_line_items(fiken_line_id);

-- Event link indexes
CREATE INDEX IF NOT EXISTS idx_invoice_event_links_invoice ON invoice_event_links(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_event_links_event ON invoice_event_links(event_id);

-- Customer Fiken index
CREATE INDEX IF NOT EXISTS idx_customers_fiken_id ON customers(fiken_customer_id);

-- =====================================================================================
-- UNIQUE CONSTRAINTS
-- =====================================================================================

-- Ensure one auto-draft per project
CREATE UNIQUE INDEX IF NOT EXISTS unique_auto_draft_per_project 
ON invoices (project_id) 
WHERE is_auto_draft = true AND status = 'draft';

-- Prevent duplicate line items from same source
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'invoice_line_items' 
    AND constraint_name = 'unique_event_source_per_invoice'
  ) THEN
    ALTER TABLE invoice_line_items 
    ADD CONSTRAINT unique_event_source_per_invoice 
    UNIQUE (invoice_id, source_type, source_id) 
    DEFERRABLE INITIALLY DEFERRED;
  END IF;
END $$;

-- Ensure unique Fiken IDs
CREATE UNIQUE INDEX IF NOT EXISTS unique_fiken_invoice_id 
ON invoices(fiken_invoice_id) 
WHERE fiken_invoice_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS unique_fiken_line_id 
ON invoice_line_items(fiken_line_id) 
WHERE fiken_line_id IS NOT NULL;

-- =====================================================================================
-- DATABASE FUNCTIONS
-- =====================================================================================

-- Function: Create line items for event
CREATE OR REPLACE FUNCTION create_line_items_for_event(p_invoice_id uuid, p_event_id uuid)
RETURNS void AS $$
DECLARE
  v_event record;
  v_crew_line_id uuid;
  v_equipment_line_id uuid;
BEGIN
  -- Get event details
  SELECT pe.*, et.name as event_type_name
  INTO v_event
  FROM project_events pe
  LEFT JOIN event_types et ON pe.event_type_id = et.id
  WHERE pe.id = p_event_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found: %', p_event_id;
  END IF;
  
  -- Create crew line item if crew_price > 0
  IF v_event.crew_price > 0 THEN
    INSERT INTO invoice_line_items (
      invoice_id, description, quantity, unit_price, line_total,
      vat_type, vat_rate, vat_amount, source_type, source_id
    ) VALUES (
      p_invoice_id,
      'Crew Services - ' || v_event.name || ' (' || TO_CHAR(v_event.date, 'YYYY-MM-DD') || ')',
      1,
      v_event.crew_price,
      v_event.crew_price,
      'HIGH',
      25.00,
      v_event.crew_price * 0.25,
      'event_crew',
      p_event_id
    ) RETURNING id INTO v_crew_line_id;
  END IF;
  
  -- Create equipment line item if equipment_price > 0
  IF v_event.equipment_price > 0 THEN
    INSERT INTO invoice_line_items (
      invoice_id, description, quantity, unit_price, line_total,
      vat_type, vat_rate, vat_amount, source_type, source_id
    ) VALUES (
      p_invoice_id,
      'Equipment Rental - ' || v_event.name || ' (' || TO_CHAR(v_event.date, 'YYYY-MM-DD') || ')',
      1,
      v_event.equipment_price,
      v_event.equipment_price,
      'HIGH',
      25.00,
      v_event.equipment_price * 0.25,
      'event_equipment',
      p_event_id
    ) RETURNING id INTO v_equipment_line_id;
  END IF;
  
  -- Update event link with line item references
  UPDATE invoice_event_links 
  SET 
    crew_line_item_id = v_crew_line_id,
    equipment_line_item_id = v_equipment_line_id,
    included_crew = (v_crew_line_id IS NOT NULL),
    included_equipment = (v_equipment_line_id IS NOT NULL)
  WHERE invoice_id = p_invoice_id AND event_id = p_event_id;
  
END;
$$ LANGUAGE plpgsql;

-- Function: Recalculate invoice totals
CREATE OR REPLACE FUNCTION recalculate_invoice_totals(p_invoice_id uuid)
RETURNS void AS $$
DECLARE
  v_subtotal numeric(10,2);
  v_tax_total numeric(10,2);
  v_total numeric(10,2);
BEGIN
  -- Calculate totals from line items
  SELECT 
    COALESCE(SUM(line_total), 0),
    COALESCE(SUM(vat_amount), 0)
  INTO v_subtotal, v_tax_total
  FROM invoice_line_items 
  WHERE invoice_id = p_invoice_id;
  
  v_total := v_subtotal + v_tax_total;
  
  -- Update invoice
  UPDATE invoices 
  SET 
    subtotal_amount = v_subtotal,
    tax_amount = v_tax_total,
    total_amount = v_total,
    updated_at = NOW()
  WHERE id = p_invoice_id;
  
END;
$$ LANGUAGE plpgsql;

-- Function: Remove event from draft invoices
CREATE OR REPLACE FUNCTION remove_event_from_draft_invoices(p_event_id uuid)
RETURNS void AS $$
DECLARE
  v_invoice_id uuid;
BEGIN
  -- Get all draft invoices containing this event
  FOR v_invoice_id IN 
    SELECT DISTINCT iel.invoice_id
    FROM invoice_event_links iel
    JOIN invoices i ON i.id = iel.invoice_id
    WHERE iel.event_id = p_event_id 
      AND i.is_auto_draft = true 
      AND i.status = 'draft'
  LOOP
    -- Remove line items for this event
    DELETE FROM invoice_line_items 
    WHERE invoice_id = v_invoice_id 
      AND source_id = p_event_id;
    
    -- Remove event link
    DELETE FROM invoice_event_links 
    WHERE invoice_id = v_invoice_id 
      AND event_id = p_event_id;
    
    -- Recalculate totals
    PERFORM recalculate_invoice_totals(v_invoice_id);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================================
-- TRIGGERS
-- =====================================================================================

-- Trigger for updated_at timestamps (reuse existing function)
DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoice_line_items_updated_at ON invoice_line_items;
CREATE TRIGGER update_invoice_line_items_updated_at
  BEFORE UPDATE ON invoice_line_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for line item changes to recalculate totals
CREATE OR REPLACE FUNCTION trigger_recalculate_invoice_totals()
RETURNS trigger AS $$
BEGIN
  -- Recalculate for the affected invoice
  PERFORM recalculate_invoice_totals(COALESCE(NEW.invoice_id, OLD.invoice_id));
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS recalculate_totals_on_line_change ON invoice_line_items;
CREATE TRIGGER recalculate_totals_on_line_change
  AFTER INSERT OR UPDATE OR DELETE ON invoice_line_items
  FOR EACH ROW
  EXECUTE FUNCTION trigger_recalculate_invoice_totals();

-- =====================================================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================================================

-- Enable RLS for security (following QUINCY patterns)
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_event_links ENABLE ROW LEVEL SECURITY;

-- =====================================================================================
-- VERIFICATION
-- =====================================================================================

-- Verify the setup
DO $$
BEGIN
    -- Check that main tables exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') THEN
        RAISE EXCEPTION 'invoices table was not created';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoice_line_items') THEN
        RAISE EXCEPTION 'invoice_line_items table was not created';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoice_event_links') THEN
        RAISE EXCEPTION 'invoice_event_links table was not created';
    END IF;
    
    -- Check that fiken_customer_id column was added
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' 
        AND column_name = 'fiken_customer_id'
    ) THEN
        RAISE EXCEPTION 'fiken_customer_id column was not added to customers table';
    END IF;
    
    -- Check that functions exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'create_line_items_for_event'
    ) THEN
        RAISE EXCEPTION 'create_line_items_for_event function was not created';
    END IF;
    
    RAISE NOTICE 'Invoice system migration completed successfully';
END $$;
