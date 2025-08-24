/**
 * 🏢 FIKEN API SERVICE
 * 
 * Direct integration with Fiken API for invoice management
 * Handles authentication, invoice creation, status sync, and error handling
 */

import { 
  FikenCustomer, 
  FikenInvoiceRequest, 
  FikenInvoiceResponse,
  FikenInvoiceCreateResult,
  InvoiceLineItem 
} from "@/types/invoice";
import { Customer } from "@/integrations/supabase/types/customer";

// =====================================================================================
// FIKEN API CONFIGURATION
// =====================================================================================

interface FikenApiConfig {
  apiKey: string;
  companySlug: string;
  baseUrl: string;
}

interface FikenApiError {
  message: string;
  code?: string;
  details?: any;
}

// =====================================================================================
// FIKEN API SERVICE
// =====================================================================================

export class FikenApiService {
  private config: FikenApiConfig;

  constructor(config: FikenApiConfig) {
    this.config = config;
  }

  // -------------------------------------------------------------------------------------
  // AUTHENTICATION & HEADERS
  // -------------------------------------------------------------------------------------

  private getHeaders(): HeadersInit {
    return {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  private getApiUrl(endpoint: string): string {
    return `${this.config.baseUrl}/companies/${this.config.companySlug}${endpoint}`;
  }

  // -------------------------------------------------------------------------------------
  // ERROR HANDLING
  // -------------------------------------------------------------------------------------

  private async handleApiResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `Fiken API error: ${response.status} ${response.statusText}`;
      
      try {
        const errorBody = await response.json();
        if (errorBody.message) {
          errorMessage = errorBody.message;
        } else if (errorBody.error) {
          errorMessage = errorBody.error;
        }
      } catch {
        // Use default error message if JSON parsing fails
      }

      throw new Error(errorMessage);
    }

    try {
      return await response.json();
    } catch (error) {
      throw new Error('Failed to parse Fiken API response');
    }
  }

  // -------------------------------------------------------------------------------------
  // CUSTOMER MANAGEMENT
  // -------------------------------------------------------------------------------------

  /**
   * Get or create customer in Fiken
   */
  async ensureCustomerExists(customer: Customer): Promise<FikenCustomer> {
    try {
      // First, try to find existing customer by organization number or email
      if (customer.organization_number) {
        const existing = await this.findCustomerByOrgNumber(customer.organization_number);
        if (existing) {
          return existing;
        }
      }

      // Create new customer in Fiken
      return await this.createCustomer(customer);
      
    } catch (error) {
      console.error('Error ensuring customer exists in Fiken:', error);
      throw new Error(`Failed to ensure customer exists: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async findCustomerByOrgNumber(orgNumber: string): Promise<FikenCustomer | null> {
    try {
      const response = await fetch(
        this.getApiUrl(`/contacts?organizationNumber=${encodeURIComponent(orgNumber)}`),
        {
          method: 'GET',
          headers: this.getHeaders()
        }
      );

      const customers = await this.handleApiResponse<FikenCustomer[]>(response);
      return customers.length > 0 ? customers[0] : null;
      
    } catch (error) {
      console.error('Error finding customer by org number:', error);
      return null;
    }
  }

  private async createCustomer(customer: Customer): Promise<FikenCustomer> {
    try {
      const customerData = {
        name: customer.name,
        email: customer.email || undefined,
        phone: customer.phone_number || undefined,
        organizationNumber: customer.organization_number || undefined,
        customerNumber: customer.customer_number || undefined
      };

      const response = await fetch(
        this.getApiUrl('/contacts'),
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(customerData)
        }
      );

      return await this.handleApiResponse<FikenCustomer>(response);
      
    } catch (error) {
      console.error('Error creating customer in Fiken:', error);
      throw new Error(`Failed to create customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // -------------------------------------------------------------------------------------
  // INVOICE MANAGEMENT
  // -------------------------------------------------------------------------------------

  /**
   * Create draft invoice in Fiken
   */
  async createDraftInvoice(
    customer: Customer,
    lineItems: InvoiceLineItem[],
    dueDate: string,
    projectReference?: string
  ): Promise<FikenInvoiceCreateResult> {
    try {
      // Ensure customer exists in Fiken
      const fikenCustomer = await this.ensureCustomerExists(customer);

      // Convert line items to Fiken format
      const fikenLines = lineItems.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unit_price_excluding_vat: item.unit_price,
        vat_type: this.mapVatTypeToFiken(item.vat_type),
        account_code: this.getAccountCodeForSourceType(item.source_type)
      }));

      // Create invoice request
      const invoiceRequest: FikenInvoiceRequest = {
        customer_id: fikenCustomer.id,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: dueDate,
        invoice_text: projectReference ? `Project: ${projectReference}` : undefined,
        lines: fikenLines,
        send_method: null // Create as draft, don't send automatically
      };

      const response = await fetch(
        this.getApiUrl('/invoices'),
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(invoiceRequest)
        }
      );

      const result = await this.handleApiResponse<FikenInvoiceCreateResult>(response);

      return {
        id: result.id,
        invoice_number: result.invoice_number,
        status: result.status,
        edit_url: `https://fiken.no/${this.config.companySlug}/invoices/${result.id}`,
        total_amount: result.total_amount
      };
      
    } catch (error) {
      console.error('Error creating draft invoice in Fiken:', error);
      throw new Error(`Failed to create invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get invoice status from Fiken
   */
  async getInvoiceStatus(fikenInvoiceId: string): Promise<FikenInvoiceResponse> {
    try {
      const response = await fetch(
        this.getApiUrl(`/invoices/${fikenInvoiceId}`),
        {
          method: 'GET',
          headers: this.getHeaders()
        }
      );

      return await this.handleApiResponse<FikenInvoiceResponse>(response);
      
    } catch (error) {
      console.error('Error getting invoice status from Fiken:', error);
      throw new Error(`Failed to get invoice status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Sync invoice status from Fiken
   */
  async syncInvoiceStatus(fikenInvoiceId: string): Promise<{
    status: string;
    sent_date?: string;
    paid_date?: string;
    total_amount: number;
  }> {
    try {
      const fikenInvoice = await this.getInvoiceStatus(fikenInvoiceId);

      return {
        status: this.mapFikenStatusToLocal(fikenInvoice.status),
        sent_date: fikenInvoice.sent_date,
        paid_date: fikenInvoice.paid_date,
        total_amount: fikenInvoice.total_amount
      };
      
    } catch (error) {
      console.error('Error syncing invoice status:', error);
      throw new Error(`Failed to sync status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // -------------------------------------------------------------------------------------
  // UTILITY METHODS
  // -------------------------------------------------------------------------------------

  private mapVatTypeToFiken(vatType: string): string {
    const mapping: Record<string, string> = {
      'HIGH': 'HIGH',
      'MEDIUM': 'MEDIUM', 
      'LOW': 'LOW',
      'EXEMPT': 'EXEMPT'
    };
    return mapping[vatType] || 'HIGH';
  }

  private getAccountCodeForSourceType(sourceType: string): string | undefined {
    // Map source types to Fiken account codes
    // These would be configured based on your Fiken chart of accounts
    const mapping: Record<string, string> = {
      'event_crew': '3000', // Service revenue
      'event_equipment': '3100', // Equipment rental revenue
      'manual_expense': '3900', // Other revenue
      'fiken_added': '3900' // Other revenue
    };
    return mapping[sourceType];
  }

  private mapFikenStatusToLocal(fikenStatus: string): string {
    // Map Fiken statuses to our local statuses
    const mapping: Record<string, string> = {
      'DRAFT': 'created_in_fiken',
      'SENT': 'sent',
      'PAID': 'paid',
      'OVERDUE': 'overdue',
      'CANCELLED': 'cancelled'
    };
    return mapping[fikenStatus] || 'created_in_fiken';
  }

  // -------------------------------------------------------------------------------------
  // HEALTH CHECK
  // -------------------------------------------------------------------------------------

  /**
   * Test API connection and authentication
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(
        this.getApiUrl('/company'),
        {
          method: 'GET',
          headers: this.getHeaders()
        }
      );

      return response.ok;
      
    } catch (error) {
      console.error('Fiken API connection test failed:', error);
      return false;
    }
  }
}

// =====================================================================================
// FACTORY FUNCTION
// =====================================================================================

/**
 * Create FikenApiService instance with configuration from Supabase secrets
 */
export async function createFikenApiService(): Promise<FikenApiService> {
  // In a real implementation, these would come from Supabase Edge Functions
  // that can access the secrets we set earlier
  const config: FikenApiConfig = {
    apiKey: process.env.FIKEN_API_KEY || 'your_fiken_api_key_here',
    companySlug: process.env.FIKEN_COMPANY_SLUG || 'your_company_slug_here',
    baseUrl: process.env.FIKEN_API_BASE_URL || 'https://api.fiken.no/api/v2'
  };

  const service = new FikenApiService(config);
  
  // Test connection on creation
  const isConnected = await service.testConnection();
  if (!isConnected) {
    console.warn('Fiken API connection test failed - check credentials');
  }

  return service;
}
