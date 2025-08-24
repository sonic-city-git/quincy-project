import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FikenInvoice {
  invoiceId: number;
  invoiceNumber: string;
  draftId?: number;
  status?: string;
  lastModifiedDate: string;
  issueDate: string;
  dueDate: string;
  customerId: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔄 Starting Fiken invoice status sync...')

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get Fiken credentials from environment (same as fiken-invoice function)
    const fikenApiKey = Deno.env.get('FIKEN_API_KEY')
    const fikenCompanySlug = Deno.env.get('FIKEN_COMPANY_SLUG')

    if (!fikenApiKey || !fikenCompanySlug) {
      throw new Error('Missing Fiken credentials in environment')
    }

    const fikenHeaders = {
      'Authorization': `Bearer ${fikenApiKey}`,
      'Content-Type': 'application/json'
    }

    const getApiUrl = (endpoint: string) => 
      `https://api.fiken.no/api/v2/companies/${fikenCompanySlug}${endpoint}`

    // Parse request body to get project ID
    const { projectId } = await req.json()
    
    if (!projectId) {
      throw new Error('Missing projectId in request')
    }

    console.log(`📋 Syncing invoice statuses for project: ${projectId}`)

    // Get all invoices for this project that have Fiken IDs but aren't marked as sent
    const { data: invoices, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        id,
        fiken_invoice_id,
        fiken_invoice_number,
        status,
        invoice_event_links (
          event_id,
          project_events (
            id,
            name,
            status,
            project_id
          )
        )
      `)
      .eq('project_id', projectId)
      .not('fiken_invoice_id', 'is', null)
      .neq('status', 'sent')

    if (invoiceError) {
      console.error('❌ Error fetching project invoices:', invoiceError)
      throw invoiceError
    }

    if (!invoices || invoices.length === 0) {
      console.log('ℹ️ No invoices to sync for this project')
      return new Response(
        JSON.stringify({ 
          success: true, 
          invoicesUpdated: 0, 
          eventsMarkedInvoiced: 0,
          message: 'No invoices to sync'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📋 Found ${invoices.length} invoices to check for project ${projectId}`)

    let invoicesUpdated = 0
    let eventsMarkedInvoiced = 0

    // Check each invoice in Fiken
    for (const invoice of invoices) {
      if (!invoice.fiken_invoice_id) continue

      try {
        console.log(`🔍 Checking Fiken invoice ${invoice.fiken_invoice_id}...`)

        // First try to get it as a sent invoice
        let fikenInvoice: FikenInvoice | null = null
        
        try {
          const invoiceResponse = await fetch(getApiUrl(`/invoices/${invoice.fiken_invoice_id}`), {
            headers: fikenHeaders
          })

          if (invoiceResponse.ok) {
            fikenInvoice = await invoiceResponse.json()
            console.log(`📄 Found as sent invoice: ${fikenInvoice?.invoiceNumber}`)
          }
        } catch (error) {
          console.log(`ℹ️ Invoice ${invoice.fiken_invoice_id} not found as sent, checking drafts...`)
        }

        // If not found as sent invoice, check if it's still a draft
        if (!fikenInvoice) {
          try {
            const draftResponse = await fetch(getApiUrl(`/invoices/drafts/${invoice.fiken_invoice_id}`), {
              headers: fikenHeaders
            })

            if (draftResponse.ok) {
              console.log(`📝 Invoice ${invoice.fiken_invoice_id} is still a draft`)
              continue // Skip - still a draft
            }
          } catch (error) {
            console.log(`⚠️ Invoice ${invoice.fiken_invoice_id} not found in drafts either`)
            continue
          }
        }

        // If we found it as a sent invoice, update our records
        if (fikenInvoice) {
          console.log(`✅ Invoice ${invoice.fiken_invoice_id} has been sent! Updating events...`)

          // Get event IDs from this invoice (only from this project)
          const eventIds = invoice.invoice_event_links
            .filter(link => link.project_events?.project_id === projectId)
            .map(link => link.project_events?.id)
            .filter(Boolean)

          if (eventIds.length > 0) {
            // Update all events to "invoiced" status
            const { error: updateError } = await supabase
              .from('project_events')
              .update({ 
                status: 'invoiced',
                updated_at: new Date().toISOString()
              })
              .in('id', eventIds)

            if (updateError) {
              console.error(`❌ Error updating events for invoice ${invoice.id}:`, updateError)
              continue
            }

            eventsMarkedInvoiced += eventIds.length
            console.log(`✅ Marked ${eventIds.length} events as invoiced`)
          }

          // Update our invoice record
          const { error: invoiceUpdateError } = await supabase
            .from('invoices')
            .update({
              status: 'sent',
              fiken_invoice_number: fikenInvoice.invoiceNumber,
              sent_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', invoice.id)

          if (invoiceUpdateError) {
            console.error(`❌ Error updating invoice ${invoice.id}:`, invoiceUpdateError)
          } else {
            invoicesUpdated++
            console.log(`✅ Updated invoice ${invoice.id} status to sent`)
          }
        }

      } catch (error) {
        console.error(`❌ Error checking invoice ${invoice.id}:`, error)
        continue
      }
    }

    console.log(`🎉 Project sync complete: ${invoicesUpdated} invoices updated, ${eventsMarkedInvoiced} events marked as invoiced`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Invoice sync completed',
        invoicesUpdated,
        eventsMarkedInvoiced,
        projectId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Fiken sync error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
