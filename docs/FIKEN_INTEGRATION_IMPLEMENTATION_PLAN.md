# 🎯 **FIKEN INTEGRATION IMPLEMENTATION PLAN**
*Project-Level Invoice Management with Fiken Draft Creation*

---

## **📋 OVERVIEW**

### **Objective**
Implement seamless invoice management within QUINCY's Project Detail Financial Tab, where users can:
1. Automatically collect "invoice ready" events into project draft invoices
2. Create draft invoices in Fiken with one click
3. Track invoice status updates from Fiken
4. Maintain clean separation: QUINCY prepares, Fiken sends/tracks

### **Core Principle**
**Ultra-simple user experience**: Events flow automatically into draft → User clicks "Create in Fiken" → Done!

### **🏗️ ARCHITECTURE COMPLIANCE**
This implementation follows established QUINCY patterns:
- **Hook Architecture**: Domain-based organization (`src/hooks/invoice/`)
- **Component Patterns**: Uses `ProjectTabCard` and existing UI components
- **Service Layer**: Follows service pattern from `src/services/`
- **Database Migrations**: Uses timestamp-based migration naming
- **TanStack Query**: Consistent with existing data fetching patterns
- **Entity Framework**: Leverages `useEntityData` where applicable

---

## **🗄️ PHASE 1: DATABASE FOUNDATION** (Week 1)

### **1.1 Invoice Tables**
```sql
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
CREATE TABLE invoice_line_items (
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
  vat_type text DEFAULT 'HIGH', -- 'HIGH'(25%), 'MEDIUM'(15%), 'LOW'(0%), 'EXEMPT'
  vat_rate numeric(5,2) DEFAULT 25.00,
  vat_amount numeric(10,2) DEFAULT 0,
  
  -- Source tracking
  source_type text NOT NULL, -- 'event_crew', 'event_equipment', 'manual_expense', 'fiken_added'
  source_id uuid, -- References project_events.id if applicable
  
  -- Display
  sort_order integer DEFAULT 0,
  is_editable boolean DEFAULT true,
  
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Event-to-invoice linking
CREATE TABLE invoice_event_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES project_events(id) ON DELETE CASCADE,
  
  -- Track what was included from this event
  included_crew boolean DEFAULT false,
  included_equipment boolean DEFAULT false,
  crew_line_item_id uuid REFERENCES invoice_line_items(id),
  equipment_line_item_id uuid REFERENCES invoice_line_items(id),
  
  created_at timestamptz DEFAULT NOW(),
  
  UNIQUE(invoice_id, event_id)
);

-- Indexes for performance
CREATE INDEX idx_invoices_project_id ON invoices(project_id);
CREATE INDEX idx_invoices_fiken_id ON invoices(fiken_invoice_id);
CREATE INDEX idx_invoice_lines_invoice_id ON invoice_line_items(invoice_id);
CREATE INDEX idx_invoice_lines_source ON invoice_line_items(source_type, source_id);
CREATE INDEX idx_invoice_event_links_invoice ON invoice_event_links(invoice_id);
CREATE INDEX idx_invoice_event_links_event ON invoice_event_links(event_id);

-- Constraints
CREATE UNIQUE INDEX unique_auto_draft_per_project 
ON invoices (project_id) 
WHERE is_auto_draft = true AND status = 'draft';

-- Prevent duplicate line items
ALTER TABLE invoice_line_items 
ADD CONSTRAINT unique_event_source_per_invoice 
UNIQUE (invoice_id, source_type, source_id) 
WHERE source_id IS NOT NULL;
```

### **1.2 Customer Fiken Integration**
```sql
-- Add Fiken customer ID to existing customers table
ALTER TABLE customers 
ADD COLUMN fiken_customer_id text UNIQUE;

-- Index for Fiken lookups
CREATE INDEX idx_customers_fiken_id ON customers(fiken_customer_id);
```

### **1.3 Database Functions**
```sql
-- Function: Auto-add event to project draft when status changes
CREATE OR REPLACE FUNCTION auto_add_event_to_project_draft()
RETURNS trigger AS $$
DECLARE
  v_draft_id uuid;
BEGIN
  -- When event becomes 'invoice ready'
  IF NEW.status = 'invoice ready' AND (OLD.status IS NULL OR OLD.status != 'invoice ready') THEN
    
    -- Get or create project auto-draft
    SELECT id INTO v_draft_id
    FROM invoices 
    WHERE project_id = NEW.project_id 
      AND is_auto_draft = true 
      AND status = 'draft'
    LIMIT 1;
    
    -- Create auto-draft if doesn't exist
    IF v_draft_id IS NULL THEN
      INSERT INTO invoices (project_id, is_auto_draft, invoice_type)
      VALUES (NEW.project_id, true, 'auto_draft')
      RETURNING id INTO v_draft_id;
    END IF;
    
    -- Link event to draft (if not already linked)
    INSERT INTO invoice_event_links (invoice_id, event_id)
    VALUES (v_draft_id, NEW.id)
    ON CONFLICT (invoice_id, event_id) DO NOTHING;
    
    -- Create line items for crew and equipment
    PERFORM create_line_items_for_event(v_draft_id, NEW.id);
    
    -- Recalculate invoice totals
    PERFORM recalculate_invoice_totals(v_draft_id);
    
  END IF;
  
  -- When event moves away from 'invoice ready'
  IF OLD.status = 'invoice ready' AND NEW.status != 'invoice ready' THEN
    PERFORM remove_event_from_draft_invoices(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic event handling
CREATE TRIGGER event_status_invoice_trigger
  AFTER UPDATE OF status ON project_events
  FOR EACH ROW
  EXECUTE FUNCTION auto_add_event_to_project_draft();

-- Function: Create line items for event
CREATE OR REPLACE FUNCTION create_line_items_for_event(p_invoice_id uuid, p_event_id uuid)
RETURNS void AS $$
DECLARE
  v_event record;
  v_crew_line_id uuid;
  v_equipment_line_id uuid;
BEGIN
  -- Get event details
  SELECT * INTO v_event
  FROM project_events 
  WHERE id = p_event_id;
  
  -- Create crew line item if crew_price > 0
  IF v_event.crew_price > 0 THEN
    INSERT INTO invoice_line_items (
      invoice_id, description, quantity, unit_price, line_total,
      vat_type, vat_rate, vat_amount, source_type, source_id
    ) VALUES (
      p_invoice_id,
      'Crew Services - ' || v_event.name,
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
      'Equipment Rental - ' || v_event.name,
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
```

---

## **⚙️ PHASE 2: BACKEND SERVICES** (Week 2)

### **2.1 TypeScript Types**
```typescript
// src/types/invoice.ts
export interface Invoice {
  id: string;
  project_id: string;
  is_auto_draft: boolean;
  invoice_type: 'standard' | 'credit_note' | 'auto_draft';
  
  fiken_invoice_id?: string;
  fiken_invoice_number?: string;
  fiken_url?: string;
  
  status: 'draft' | 'created_in_fiken' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  
  subtotal_amount: number;
  tax_amount: number;
  total_amount: number;
  
  invoice_date: string;
  due_date: string;
  sent_date?: string;
  paid_date?: string;
  
  fiken_created_at?: string;
  last_synced_at?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceLineItem {
  id: string;
  invoice_id: string;
  fiken_line_id?: string;
  
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  
  vat_type: 'HIGH' | 'MEDIUM' | 'LOW' | 'EXEMPT';
  vat_rate: number;
  vat_amount: number;
  
  source_type: 'event_crew' | 'event_equipment' | 'manual_expense' | 'fiken_added';
  source_id?: string;
  
  sort_order: number;
  is_editable: boolean;
  created_at: string;
  updated_at: string;
}

export interface InvoiceEventLink {
  id: string;
  invoice_id: string;
  event_id: string;
  included_crew: boolean;
  included_equipment: boolean;
  crew_line_item_id?: string;
  equipment_line_item_id?: string;
  created_at: string;
}

export interface InvoiceWithDetails extends Invoice {
  line_items: InvoiceLineItem[];
  event_links: (InvoiceEventLink & {
    event: CalendarEvent;
  })[];
  project: Project & {
    customer: Customer;
  };
}
```

### **2.2 Project Invoice Service**
```typescript
// src/services/invoice/ProjectInvoiceService.ts
// Following QUINCY service patterns from src/services/pricing/ and src/services/stock/
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Invoice, InvoiceWithDetails } from "@/types/invoice";

export class ProjectInvoiceService {
  // Get or create project auto-draft
  async ensureProjectDraftExists(projectId: string): Promise<Invoice> {
    let { data: draft } = await supabase
      .from('invoices')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_auto_draft', true)
      .eq('status', 'draft')
      .single();
    
    if (!draft) {
      const { data: newDraft, error } = await supabase
        .from('invoices')
        .insert({
          project_id: projectId,
          is_auto_draft: true,
          invoice_type: 'auto_draft',
          status: 'draft'
        })
        .select()
        .single();
      
      if (error) throw error;
      draft = newDraft;
    }
    
    return draft;
  }
  
  // Get project draft with full details
  async getProjectDraftWithDetails(projectId: string): Promise<InvoiceWithDetails | null> {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        line_items:invoice_line_items(*),
        event_links:invoice_event_links(
          *,
          event:project_events(*)
        ),
        project:projects(
          *,
          customer:customers(*)
        )
      `)
      .eq('project_id', projectId)
      .eq('is_auto_draft', true)
      .eq('status', 'draft')
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
  
  // Add event to project draft
  async addEventToProjectDraft(eventId: string): Promise<void> {
    const event = await this.getEvent(eventId);
    const draft = await this.ensureProjectDraftExists(event.project_id);
    
    // Check if already linked
    const { data: existingLink } = await supabase
      .from('invoice_event_links')
      .select('*')
      .eq('invoice_id', draft.id)
      .eq('event_id', eventId)
      .single();
    
    if (existingLink) return;
    
    // Create link (triggers will handle line items)
    await supabase
      .from('invoice_event_links')
      .insert({
        invoice_id: draft.id,
        event_id: eventId
      });
    
    toast.success(`"${event.name}" added to project invoice`);
  }
  
  // Convert draft to real invoice and create in Fiken
  async createInvoiceInFiken(projectId: string): Promise<Invoice> {
    const draft = await this.getProjectDraftWithDetails(projectId);
    if (!draft) throw new Error('No draft invoice found');
    
    try {
      // 1. Convert auto-draft to standard invoice
      const { data: invoice, error: updateError } = await supabase
        .from('invoices')
        .update({
          is_auto_draft: false,
          invoice_type: 'standard',
          status: 'creating_in_fiken',
          invoice_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', draft.id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      
      // 2. Create in Fiken
      const fikenInvoice = await this.fikenService.createDraftInvoice({
        customer: draft.project.customer,
        lines: draft.line_items,
        due_date: invoice.due_date,
        project_reference: draft.project.name
      });
      
      // 3. Update with Fiken data
      const { data: updatedInvoice, error: fikenUpdateError } = await supabase
        .from('invoices')
        .update({
          fiken_invoice_id: fikenInvoice.id,
          fiken_invoice_number: fikenInvoice.invoice_number,
          fiken_url: fikenInvoice.edit_url,
          status: 'created_in_fiken',
          fiken_created_at: new Date().toISOString()
        })
        .eq('id', invoice.id)
        .select()
        .single();
      
      if (fikenUpdateError) throw fikenUpdateError;
      
      // 4. Mark events as invoiced
      const eventIds = draft.event_links.map(link => link.event_id);
      await supabase
        .from('project_events')
        .update({ status: 'invoiced' })
        .in('id', eventIds);
      
      // 5. Create new auto-draft for future events
      await this.ensureProjectDraftExists(projectId);
      
      return updatedInvoice;
      
    } catch (error) {
      // Rollback on error
      await supabase
        .from('invoices')
        .update({
          is_auto_draft: true,
          invoice_type: 'auto_draft',
          status: 'draft'
        })
        .eq('id', draft.id);
      
      throw error;
    }
  }
  
  private async getEvent(eventId: string) {
    const { data, error } = await supabase
      .from('project_events')
      .select('*, project:projects(*)')
      .eq('id', eventId)
      .single();
    
    if (error) throw error;
    return data;
  }
}
```

### **2.3 Fiken API Service**
```typescript
// src/services/fiken/FikenApiService.ts
interface FikenApiConfig {
  apiUrl: string;
  companyId: string;
  apiToken: string;
}

interface FikenInvoiceRequest {
  customer: Customer;
  lines: InvoiceLineItem[];
  due_date: string;
  project_reference: string;
}

interface FikenInvoiceResponse {
  id: string;
  invoice_number: string;
  status: string;
  edit_url: string;
  total_amount: number;
}

export class FikenApiService {
  constructor(private config: FikenApiConfig) {}
  
  async createDraftInvoice(request: FikenInvoiceRequest): Promise<FikenInvoiceResponse> {
    // 1. Ensure customer exists in Fiken
    const fikenCustomer = await this.ensureFikenCustomer(request.customer);
    
    // 2. Map line items to Fiken format
    const fikenLines = request.lines.map(line => ({
      description: line.description,
      quantity: line.quantity,
      unit_price_excluding_vat: line.unit_price,
      vat_type: this.mapVatType(line.vat_type),
      account_code: this.getAccountCode(line.source_type)
    }));
    
    // 3. Create invoice in Fiken
    const response = await fetch(`${this.config.apiUrl}/companies/${this.config.companyId}/invoices`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customer_id: fikenCustomer.id,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: request.due_date,
        invoice_text: `Project: ${request.project_reference}`,
        lines: fikenLines,
        send_method: null // Create as draft, don't auto-send
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Fiken API error: ${response.status} - ${error}`);
    }
    
    const fikenInvoice = await response.json();
    
    return {
      id: fikenInvoice.invoice_id,
      invoice_number: fikenInvoice.invoice_number,
      status: 'draft',
      edit_url: `${this.config.webUrl}/invoices/${fikenInvoice.invoice_id}/edit`,
      total_amount: fikenInvoice.total_amount
    };
  }
  
  async getInvoiceStatus(fikenInvoiceId: string): Promise<any> {
    const response = await fetch(
      `${this.config.apiUrl}/companies/${this.config.companyId}/invoices/${fikenInvoiceId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiToken}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to get invoice status: ${response.statusText}`);
    }
    
    return await response.json();
  }
  
  private async ensureFikenCustomer(customer: Customer): Promise<any> {
    // Check if customer already exists in Fiken
    if (customer.fiken_customer_id) {
      return await this.getFikenCustomer(customer.fiken_customer_id);
    }
    
    // Create customer in Fiken
    const response = await fetch(`${this.config.apiUrl}/companies/${this.config.companyId}/customers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: customer.name,
        email: customer.email,
        phone: customer.phone_number,
        organization_number: customer.organization_number,
        customer_number: customer.customer_number
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create customer in Fiken: ${response.statusText}`);
    }
    
    const fikenCustomer = await response.json();
    
    // Update QUINCY customer with Fiken ID
    await supabase
      .from('customers')
      .update({ fiken_customer_id: fikenCustomer.customer_id })
      .eq('id', customer.id);
    
    return fikenCustomer;
  }
  
  private mapVatType(vatType: string): string {
    const mapping = {
      'HIGH': 'HIGH', // 25%
      'MEDIUM': 'MEDIUM', // 15%
      'LOW': 'LOW', // 0%
      'EXEMPT': 'EXEMPT'
    };
    return mapping[vatType] || 'HIGH';
  }
  
  private getAccountCode(sourceType: string): string {
    const mapping = {
      'event_crew': '3000', // Revenue - Services
      'event_equipment': '3100', // Revenue - Equipment
      'manual_expense': '6000', // Expenses
      'fiken_added': '3000' // Default to services
    };
    return mapping[sourceType] || '3000';
  }
}
```

---

## **🎨 PHASE 3: UI COMPONENTS** (Week 3)

### **3.1 Enhanced Financial Tab**
```typescript
// src/components/projectdetail/financial/FinancialTab.tsx
// Following existing tab pattern from GeneralTab.tsx and ResourcesTab.tsx
import { DollarSign, Clock, FileText, ExternalLink } from "lucide-react";
import { Project } from "@/types/projects";
import { ProjectTabCard } from "../shared/ProjectTabCard";
import { ProjectInvoiceDraft } from "./components/ProjectInvoiceDraft";
import { FikenInvoicesSection } from "./components/FikenInvoicesSection";
import { EventsReadyToInvoice } from "./components/EventsReadyToInvoice";
import { useProjectInvoicing } from "./hooks/useProjectInvoicing";

interface FinancialTabProps {
  project: Project;
  projectId: string;
}

export function FinancialTab({ project, projectId }: FinancialTabProps) {
  const {
    projectDraft,
    fikenInvoices,
    invoiceReadyEvents,
    isLoading,
    createInvoiceInFiken,
    addEventsToProjectDraft,
    syncInvoiceStatuses
  } = useProjectInvoicing(projectId);
  
  // Auto-sync Fiken statuses when tab loads
  useEffect(() => {
    syncInvoiceStatuses();
  }, [syncInvoiceStatuses]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {/* 🎯 PRIMARY: Draft Invoice Creation */}
      <ProjectTabCard 
        title="Invoice Preparation" 
        icon={DollarSign}
        iconColor="text-green-500"
      >
        <ProjectInvoiceDraft 
          draft={projectDraft}
          project={project}
          onCreateInFiken={() => createInvoiceInFiken()}
        />
      </ProjectTabCard>
      
      {/* 📋 SECONDARY: Fiken Invoice Status */}
      {fikenInvoices && fikenInvoices.length > 0 && (
        <ProjectTabCard
          title="Fiken Invoices"
          icon={ExternalLink}
          iconColor="text-purple-500"
        >
          <FikenInvoicesSection 
            invoices={fikenInvoices}
            onSyncStatus={syncInvoiceStatuses}
          />
        </ProjectTabCard>
      )}
      
      {/* ⏳ TERTIARY: Events Ready to Add */}
      {invoiceReadyEvents && invoiceReadyEvents.length > 0 && (
        <ProjectTabCard
          title="Ready to Invoice"
          icon={Clock}
          iconColor="text-blue-500"
        >
          <EventsReadyToInvoice 
            events={invoiceReadyEvents}
            onAddToInvoice={addEventsToProjectDraft}
          />
        </ProjectTabCard>
      )}
      
      {/* Empty state if no invoice activity */}
      {!projectDraft && !fikenInvoices?.length && !invoiceReadyEvents?.length && (
        <ProjectTabCard
          title="Invoice Management"
          icon={DollarSign}
          iconColor="text-gray-400"
        >
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No invoice activity yet</p>
            <p className="text-sm mt-1">
              Events will appear here when marked as "invoice ready"
            </p>
          </div>
        </ProjectTabCard>
      )}
    </div>
  );
}
```

### **3.2 Project Invoice Draft Component**
```typescript
// src/components/projectdetail/financial/components/ProjectInvoiceDraft.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2, Send, Edit3 } from "lucide-react";
import { InvoiceWithDetails } from "@/types/invoice";
import { Project } from "@/types/projects";
import { InvoiceLineItemsTable } from "./InvoiceLineItemsTable";
import { InvoiceDetailsPanel } from "./InvoiceDetailsPanel";
import { EmptyInvoiceState } from "./EmptyInvoiceState";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface ProjectInvoiceDraftProps {
  draft: InvoiceWithDetails | null;
  project: Project;
  onCreateInFiken: () => Promise<void>;
}

export function ProjectInvoiceDraft({ 
  draft, 
  project, 
  onCreateInFiken 
}: ProjectInvoiceDraftProps) {
  const [isCreating, setIsCreating] = useState(false);
  
  const handleCreateInFiken = async () => {
    setIsCreating(true);
    
    try {
      await onCreateInFiken();
      
      toast.success('Invoice created in Fiken!', {
        description: 'You can now edit and send it from Fiken',
        action: {
          label: 'Open Fiken',
          onClick: () => window.open(process.env.NEXT_PUBLIC_FIKEN_WEB_URL, '_blank')
        }
      });
      
    } catch (error: any) {
      toast.error('Failed to create invoice in Fiken', {
        description: error.message
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  const hasItems = draft?.line_items && draft.line_items.length > 0;
  
  return (
    <div className="space-y-6">
      {/* Header with action */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            Draft Invoice - {project.customer?.name}
          </h3>
          <p className="text-sm text-muted-foreground">
            {draft?.line_items?.length || 0} items • 
            {formatCurrency(draft?.total_amount || 0)}
          </p>
        </div>
        
        {/* 🎯 MAIN ACTION BUTTON */}
        <Button 
          onClick={handleCreateInFiken}
          disabled={!hasItems || isCreating}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating in Fiken...
            </>
          ) : (
            <>
              <ExternalLink className="mr-2 h-4 w-4" />
              Create in Fiken
            </>
          )}
        </Button>
      </div>
      
      {/* Invoice content */}
      {hasItems ? (
        <>
          <InvoiceLineItemsTable lineItems={draft.line_items} />
          <InvoiceDetailsPanel 
            draft={draft}
            project={project}
          />
        </>
      ) : (
        <EmptyInvoiceState />
      )}
    </div>
  );
}
```

### **3.3 Supporting Components**
```typescript
// src/components/projectdetail/financial/components/InvoiceLineItemsTable.tsx
export function InvoiceLineItemsTable({ lineItems }: { lineItems: InvoiceLineItem[] }) {
  // Implementation with proper table structure, source badges, etc.
}

// src/components/projectdetail/financial/components/FikenInvoicesSection.tsx
export function FikenInvoicesSection({ invoices, onSyncStatus }: {
  invoices: Invoice[];
  onSyncStatus: () => void;
}) {
  // Implementation showing Fiken invoice status cards
}

// src/components/projectdetail/financial/components/EventsReadyToInvoice.tsx
export function EventsReadyToInvoice({ events, onAddToInvoice }: {
  events: CalendarEvent[];
  onAddToInvoice: (eventIds: string[]) => void;
}) {
  // Implementation for adding events to draft
}
```

### **3.4 Custom Hook**
```typescript
// src/hooks/invoice/useProjectInvoicing.ts
// Following QUINCY hook architecture patterns from src/hooks/project/ and src/hooks/event/
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProjectInvoiceService } from "@/services/invoice/ProjectInvoiceService";

export function useProjectInvoicing(projectId: string) {
  const queryClient = useQueryClient();
  const invoiceService = new ProjectInvoiceService();
  
  const { data: projectDraft, isLoading } = useQuery({
    queryKey: ['project-invoice-draft', projectId],
    queryFn: () => invoiceService.getProjectDraftWithDetails(projectId)
  });
  
  const { data: fikenInvoices } = useQuery({
    queryKey: ['project-fiken-invoices', projectId],
    queryFn: () => invoiceService.getProjectFikenInvoices(projectId)
  });
  
  const { data: invoiceReadyEvents } = useQuery({
    queryKey: ['invoice-ready-events', projectId],
    queryFn: () => invoiceService.getInvoiceReadyEvents(projectId)
  });
  
  const createInvoiceInFiken = useMutation({
    mutationFn: () => invoiceService.createInvoiceInFiken(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-invoice-draft', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-fiken-invoices', projectId] });
      queryClient.invalidateQueries({ queryKey: ['invoice-ready-events', projectId] });
    }
  });
  
  const addEventsToProjectDraft = useMutation({
    mutationFn: (eventIds: string[]) => 
      Promise.all(eventIds.map(id => invoiceService.addEventToProjectDraft(id))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-invoice-draft', projectId] });
      queryClient.invalidateQueries({ queryKey: ['invoice-ready-events', projectId] });
    }
  });
  
  return {
    projectDraft,
    fikenInvoices,
    invoiceReadyEvents,
    isLoading,
    createInvoiceInFiken: createInvoiceInFiken.mutateAsync,
    addEventsToProjectDraft: addEventsToProjectDraft.mutateAsync,
    syncInvoiceStatuses: () => invoiceService.syncAllProjectInvoices(projectId)
  };
}
```

---

## **🔄 PHASE 4: FIKEN STATUS SYNC** (Week 4)

### **4.1 Status Sync Service**
```typescript
// src/services/fiken/FikenStatusSyncService.ts
export class FikenStatusSyncService {
  async syncAllProjectInvoices(projectId: string): Promise<void> {
    const { data: invoices } = await supabase
      .from('invoices')
      .select('*')
      .eq('project_id', projectId)
      .not('fiken_invoice_id', 'is', null);
    
    for (const invoice of invoices || []) {
      try {
        await this.syncInvoiceStatus(invoice);
      } catch (error) {
        console.error(`Failed to sync invoice ${invoice.id}:`, error);
      }
    }
  }
  
  private async syncInvoiceStatus(invoice: Invoice): Promise<void> {
    const fikenStatus = await this.fikenApi.getInvoiceStatus(invoice.fiken_invoice_id);
    
    const statusMap = {
      'DRAFT': 'created_in_fiken',
      'SENT': 'sent', 
      'PAID': 'paid',
      'OVERDUE': 'overdue',
      'CANCELLED': 'cancelled'
    };
    
    const newStatus = statusMap[fikenStatus.status] || invoice.status;
    
    if (newStatus !== invoice.status) {
      await supabase
        .from('invoices')
        .update({
          status: newStatus,
          sent_date: fikenStatus.sent_date,
          paid_date: fikenStatus.paid_date,
          last_synced_at: new Date().toISOString()
        })
        .eq('id', invoice.id);
      
      // Notify about status changes
      this.notifyStatusChange(invoice, newStatus);
    }
  }
}
```

---

## **📋 IMPLEMENTATION CHECKLIST**

### **Database Migration**
- [ ] Create migration file: `20250112000000_create_invoice_system.sql`
- [ ] Create invoice tables with proper QUINCY constraints
- [ ] Add `fiken_customer_id` to existing customers table  
- [ ] Create database functions following RPC naming patterns
- [ ] Set up triggers using established trigger patterns
- [ ] Create indexes following QUINCY performance patterns

### **Backend Services**
- [ ] ProjectInvoiceService implementation
- [ ] FikenApiService implementation
- [ ] FikenStatusSyncService implementation
- [ ] Error handling and logging
- [ ] Input validation and sanitization

### **Frontend Components**
- [ ] Enhanced FinancialTab following existing tab patterns
- [ ] ProjectInvoiceDraft using ProjectTabCard consistently
- [ ] InvoiceLineItemsTable with design system components
- [ ] FikenInvoicesSection matching resource tab styling
- [ ] EventsReadyToInvoice following event list patterns
- [ ] useProjectInvoicing hook in `src/hooks/invoice/` domain

### **Integration & Testing**
- [ ] Fiken API credentials setup
- [ ] Error boundary implementation
- [ ] Loading states and UX polish
- [ ] Manual testing with real Fiken account
- [ ] Edge case handling (failed API calls, etc.)

---

## **🎯 SUCCESS CRITERIA**

### **User Experience Goals**
✅ **Ultra-Simple Workflow**: Events → Auto-draft → "Create in Fiken" → Done!
✅ **No Manual Invoice Management**: Everything automatic except final action
✅ **Clear Status Tracking**: Always know invoice status from Fiken
✅ **Error Recovery**: Graceful handling of API failures

### **Technical Goals**
✅ **Reliable Auto-Draft System**: Events automatically flow to invoices
✅ **Bulletproof Fiken Integration**: Robust API handling with retries
✅ **Real-Time Status Sync**: Invoice status always up-to-date
✅ **Data Integrity**: No duplicate line items or lost events

### **Business Goals**
✅ **Faster Invoicing**: Reduce time from event completion to invoice creation
✅ **Fewer Errors**: Eliminate manual invoice entry mistakes
✅ **Better Cash Flow**: Faster invoice creation → faster payment
✅ **Professional Presentation**: Consistent, branded invoices via Fiken

---

## **🚀 GETTING STARTED**

1. **Create database migration**: Start with Phase 1 database schema
2. **Implement core service**: Build ProjectInvoiceService foundations
3. **Create basic UI**: Build minimal FinancialTab with draft display
4. **Add Fiken integration**: Implement invoice creation in Fiken
5. **Polish & test**: Add status sync, error handling, UX improvements

**Target Timeline**: 4 weeks for full implementation
**MVP Delivery**: 2 weeks for basic draft → Fiken creation

---

*This plan creates the most user-friendly invoice system possible while maintaining clean separation between QUINCY (preparation) and Fiken (sending/tracking).*
