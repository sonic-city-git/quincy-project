/**
 * 🧾 INVOICE SYSTEM TYPES
 * 
 * TypeScript definitions for the Fiken integration invoice system
 * Follows QUINCY type patterns and integrates with existing project/event types
 */

import { Project } from "./projects";
import { Customer } from "@/integrations/supabase/types/customer";
import { CalendarEvent } from "./events";

// =====================================================================================
// CORE INVOICE TYPES
// =====================================================================================

export interface Invoice {
  id: string;
  project_id: string;
  
  // Auto-draft system
  is_auto_draft: boolean;
  invoice_type: 'standard' | 'credit_note' | 'auto_draft';
  
  // Fiken integration
  fiken_invoice_id?: string;
  fiken_invoice_number?: string;
  fiken_url?: string;
  
  // Status tracking
  status: 'draft' | 'created_in_fiken' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  
  // Financial data
  subtotal_amount: number;
  tax_amount: number;
  total_amount: number;
  
  // Dates
  invoice_date: string;
  due_date: string;
  sent_date?: string;
  paid_date?: string;
  
  // Sync tracking
  fiken_created_at?: string;
  last_synced_at?: string;
  
  // Standard timestamps
  created_at: string;
  updated_at: string;
}

export interface InvoiceLineItem {
  id: string;
  invoice_id: string;
  
  // Fiken sync
  fiken_line_id?: string;
  
  // Line item data
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  
  // Tax handling (Norwegian VAT)
  vat_type: 'HIGH' | 'MEDIUM' | 'LOW' | 'EXEMPT';
  vat_rate: number;
  vat_amount: number;
  
  // Source tracking
  source_type: 'event_crew' | 'event_equipment' | 'manual_expense' | 'fiken_added';
  source_id?: string;
  
  // Display
  sort_order: number;
  is_editable: boolean;
  
  // Standard timestamps
  created_at: string;
  updated_at: string;
}

export interface InvoiceEventLink {
  id: string;
  invoice_id: string;
  event_id: string;
  
  // Track what was included
  included_crew: boolean;
  included_equipment: boolean;
  crew_line_item_id?: string;
  equipment_line_item_id?: string;
  
  created_at: string;
}

// =====================================================================================
// EXTENDED TYPES FOR UI COMPONENTS
// =====================================================================================

export interface InvoiceWithDetails extends Invoice {
  line_items: InvoiceLineItem[];
  event_links: (InvoiceEventLink & {
    event: CalendarEvent;
  })[];
  project: Project & {
    customer: Customer;
  };
}

export interface InvoiceEventLinkWithEvent extends InvoiceEventLink {
  event: CalendarEvent;
}

// =====================================================================================
// FIKEN INTEGRATION TYPES
// =====================================================================================

export interface FikenCustomer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  organization_number?: string;
  customer_number?: string;
}

export interface FikenInvoiceLine {
  description: string;
  quantity: number;
  unit_price_excluding_vat: number;
  vat_type: string;
  account_code?: string;
}

export interface FikenInvoiceRequest {
  customer_id: string;
  issue_date: string;
  due_date: string;
  invoice_text?: string;
  lines: FikenInvoiceLine[];
  send_method?: string | null;
}

export interface FikenInvoiceResponse {
  invoice_id: string;
  invoice_number: string;
  status: string;
  total_amount: number;
  created_date: string;
  due_date: string;
  sent_date?: string;
  paid_date?: string;
  lines: Array<{
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
    vat_rate: number;
    vat_amount: number;
  }>;
}

export interface FikenInvoiceCreateResult {
  id: string;
  invoice_number: string;
  status: string;
  edit_url: string;
  total_amount: number;
}

// =====================================================================================
// SERVICE TYPES
// =====================================================================================

export interface CreateInvoiceRequest {
  customer: Customer;
  lines: InvoiceLineItem[];
  due_date: string;
  project_reference: string;
}

export interface InvoiceStatusUpdate {
  status: Invoice['status'];
  fiken_status?: string;
  sent_date?: string;
  paid_date?: string;
  payment_amount?: number;
  last_synced_at: string;
}

// =====================================================================================
// HOOK TYPES
// =====================================================================================

export interface ProjectInvoicingHook {
  // Data
  projectDraft: InvoiceWithDetails | null;
  fikenInvoices: Invoice[];
  invoiceReadyEvents: CalendarEvent[];
  
  // Loading states
  isDraftLoading: boolean;
  isFikenLoading: boolean;
  isEventsLoading: boolean;
  
  // Actions
  createInvoiceInFiken: () => Promise<Invoice>;
  addEventsToProjectDraft: (eventIds: string[]) => Promise<void>;
  syncInvoiceStatuses: () => Promise<void>;
  removeEventFromDraft: (eventId: string) => Promise<void>;
  
  // Error states
  error: Error | null;
}

// =====================================================================================
// VALIDATION TYPES
// =====================================================================================

export interface InvoiceValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface LineItemValidation {
  isValid: boolean;
  errors: {
    description?: string;
    quantity?: string;
    unit_price?: string;
    vat_type?: string;
  };
}

// =====================================================================================
// CONSTANTS
// =====================================================================================

export const INVOICE_STATUS_LABELS = {
  draft: 'Draft',
  created_in_fiken: 'Created in Fiken',
  sent: 'Sent',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled'
} as const;

export const VAT_TYPES = {
  HIGH: { rate: 25, label: '25% (High)' },
  MEDIUM: { rate: 15, label: '15% (Medium)' },
  LOW: { rate: 0, label: '0% (Low)' },
  EXEMPT: { rate: 0, label: 'Exempt' }
} as const;

export const SOURCE_TYPE_LABELS = {
  event_crew: 'Crew Services',
  event_equipment: 'Equipment Rental',
  manual_expense: 'Manual Expense',
  fiken_added: 'Added in Fiken'
} as const;

// =====================================================================================
// TYPE GUARDS
// =====================================================================================

export function isInvoice(obj: any): obj is Invoice {
  return obj && 
    typeof obj.id === 'string' &&
    typeof obj.project_id === 'string' &&
    typeof obj.status === 'string' &&
    typeof obj.total_amount === 'number';
}

export function isInvoiceLineItem(obj: any): obj is InvoiceLineItem {
  return obj && 
    typeof obj.id === 'string' &&
    typeof obj.invoice_id === 'string' &&
    typeof obj.description === 'string' &&
    typeof obj.quantity === 'number' &&
    typeof obj.unit_price === 'number';
}

export function isInvoiceWithDetails(obj: any): obj is InvoiceWithDetails {
  return isInvoice(obj) &&
    Array.isArray(obj.line_items) &&
    Array.isArray(obj.event_links) &&
    obj.project &&
    obj.project.customer;
}

// =====================================================================================
// UTILITY TYPES
// =====================================================================================

export type InvoiceInsert = Omit<Invoice, 'id' | 'created_at' | 'updated_at'>;
export type InvoiceUpdate = Partial<Omit<Invoice, 'id' | 'created_at' | 'updated_at'>>;

export type InvoiceLineItemInsert = Omit<InvoiceLineItem, 'id' | 'created_at' | 'updated_at'>;
export type InvoiceLineItemUpdate = Partial<Omit<InvoiceLineItem, 'id' | 'created_at' | 'updated_at'>>;

export type InvoiceEventLinkInsert = Omit<InvoiceEventLink, 'id' | 'created_at'>;
