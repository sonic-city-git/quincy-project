/**
 * 🧾 FINANCIAL TAB
 * 
 * Project financial management with Fiken integration
 * Redesigned to match QUINCY design system patterns
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { 
  FileText, 
  ExternalLink,
  AlertCircle,
  DollarSign,
  CreditCard
} from 'lucide-react';
import { useProjectInvoicing } from '@/hooks/invoice/useProjectInvoicing';
import { useQueryClient } from '@tanstack/react-query';
import { InvoiceWithDetails, Invoice } from '@/types/invoice';
import { Project } from '@/types/projects';
import { formatCurrency } from '@/utils/formatters';
import { INVOICE_STATUS_LABELS } from '@/types/invoice';
import { ProjectTabCard } from '../shared/ProjectTabCard';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { STATUS_COLORS } from '@/components/dashboard/shared/StatusCard';
import { cn } from '@/lib/utils';
import { CalendarEvent } from '@/types/events';
import { TooltipProvider } from '@/components/ui/tooltip';
import { EventGrid, EventGridColumns } from '../general/events/layout/EventGrid';
import { EventStatus } from '../general/events/components/EventStatus';
import { EVENT_COLORS } from '@/constants/eventColors';
import { formatDisplayDate } from '@/utils/dateFormatters';
import { formatPrice } from '@/utils/priceFormatters';
import { statusUtils } from '@/constants/eventStatus';
import { Calendar, MapPin, Package, Users } from 'lucide-react';
import { useReactivePricing } from '@/services/pricing/hooks';

// =====================================================================================
// MAIN COMPONENT
// =====================================================================================

interface FinancialTabProps {
  project: Project;
  projectId: string;
}

export function FinancialTab({ project, projectId }: FinancialTabProps) {
  const queryClient = useQueryClient();
  
  const {
    projectDraft,
    fikenInvoices,
    invoiceReadyEvents,
    isDraftLoading,
    isFikenLoading,
    isEventsLoading,
    removeEventFromDraft,
    error
  } = useProjectInvoicing(projectId);

  // Force refresh when Financial Tab is accessed
  useEffect(() => {
    // Invalidate all invoice-related queries to force fresh data
    queryClient.invalidateQueries({ queryKey: ['project-invoice-draft', projectId] });
    queryClient.invalidateQueries({ queryKey: ['project-fiken-invoices', projectId] });
    queryClient.invalidateQueries({ queryKey: ['invoice-ready-events', projectId] });
  }, [projectId, queryClient]);

  // -------------------------------------------------------------------------------------
  // EVENT HANDLERS
  // -------------------------------------------------------------------------------------

  const handleRemoveEvent = async (eventId: string) => {
    try {
      await removeEventFromDraft(eventId);
    } catch (error) {
      console.error('Error removing event:', error);
    }
  };

  // Use info colors to match other tabs
  const infoColors = STATUS_COLORS.info;

  return (
    <ProjectTabCard
      icon={CreditCard}
      iconColor="text-primary"
      padding="sm"
    >
      <div className="space-y-4">
        {/* Header with consistent styling */}
        <SectionHeader
          header={{
            title: "Financial Management",
            icon: CreditCard,
            iconColor: "text-primary"
          }}
        />


        
        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Simplified Two-Section Layout */}
        <div className="space-y-4">
          {/* Draft Invoice - Auto-synced with Fiken */}
          <AutoDraftInvoiceCard
            projectDraft={projectDraft}
            isDraftLoading={isDraftLoading}
            onRemoveEvent={handleRemoveEvent}
            invoiceReadyCount={invoiceReadyEvents.length}
          />

          {/* Sent Invoices */}
          <FikenInvoicesCard
            invoices={fikenInvoices}
            isFikenLoading={isFikenLoading}
          />
        </div>
      </div>
    </ProjectTabCard>
  );
}

// =====================================================================================
// SUB-COMPONENTS
// =====================================================================================

interface AutoDraftInvoiceCardProps {
  projectDraft: InvoiceWithDetails | null;
  isDraftLoading: boolean;
  onRemoveEvent: (eventId: string) => void;
  invoiceReadyCount: number;
}

function AutoDraftInvoiceCard({
  projectDraft,
  isDraftLoading,
  onRemoveEvent,
  invoiceReadyCount
}: AutoDraftInvoiceCardProps) {
  const hasEvents = projectDraft?.event_links && projectDraft.event_links.length > 0;
  const infoColors = STATUS_COLORS.info;

  return (
    <div className={cn(
      'rounded-lg border transition-all hover:shadow-md',
      'bg-gradient-to-br', infoColors.bg,
      'border', infoColors.border
    )}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">Draft Invoice</h3>
            <Badge variant="outline" className="text-xs">
              Auto-synced
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isDraftLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        ) : !hasEvents ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No events in draft invoice</p>
            <p className="text-sm">
              {invoiceReadyCount > 0 
                ? `${invoiceReadyCount} invoice-ready events are being synced...`
                : 'Mark events as "invoice ready" and they will automatically appear here'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Customer Info */}
            {projectDraft?.project?.customer && (
              <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
                <p className="font-medium">{projectDraft.project.customer.name}</p>
                {projectDraft.project.customer.organization_number && (
                  <p className="text-sm text-muted-foreground">
                    Org: {projectDraft.project.customer.organization_number}
                  </p>
                )}
              </div>
            )}

            {/* Events in Draft - Using same format as General Tab */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Events in Draft:</h4>
              <TooltipProvider>
                <div className="space-y-2">
                  {projectDraft?.event_links.map((link) => {
                    // Convert the event data to CalendarEvent format
                    const calendarEvent: CalendarEvent = {
                      id: link.event.id,
                      name: link.event.name,
                      date: new Date(link.event.date),
                      status: link.event.status as CalendarEvent['status'],
                      type: link.event.event_types || link.event.type,
                      variant_name: link.event.variant_name || '',
                      location: link.event.location || '',
                      equipment_price: link.event.equipment_price || 0,
                      crew_price: link.event.crew_price || 0,
                      total_price: link.event.total_price || 0,
                      project_id: projectId,
                      event_type_id: link.event.event_type_id || '',
                      variant_id: link.event.variant_id || '',
                      created_at: link.event.created_at || new Date().toISOString(),
                      updated_at: link.event.updated_at || new Date().toISOString()
                    };

                    return (
                      <div key={link.id} className="relative">
                        <FinancialEventCard 
                          event={calendarEvent}
                          onRemoveEvent={() => onRemoveEvent(link.event_id)}
                        />
                      </div>
                    );
                  })}
                </div>
              </TooltipProvider>
            </div>

            {/* Total */}
            <div className="border-t border-border/50 pt-3">
              <div className="flex justify-between items-center font-bold text-lg">
                <span>Total:</span>
                <span className="text-primary">{formatCurrency(projectDraft?.total_amount || 0)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



interface FikenInvoicesCardProps {
  invoices: Invoice[];
  isFikenLoading: boolean;
}

function FikenInvoicesCard({ invoices, isFikenLoading }: FikenInvoicesCardProps) {
  const successColors = STATUS_COLORS.success;

  return (
    <div className={cn(
      'rounded-lg border transition-all hover:shadow-md',
      'bg-gradient-to-br', successColors.bg,
      'border', successColors.border
    )}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/20">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-500" />
          <h3 className="font-semibold text-lg">Sent Invoices</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isFikenLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No invoices sent yet</p>
            <p className="text-sm">Created invoices will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="p-3 border border-border/50 rounded-lg bg-background/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {invoice.fiken_invoice_number || `Invoice ${invoice.id.slice(0, 8)}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(invoice.invoice_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="font-medium">{formatCurrency(invoice.total_amount)}</p>
                    <Badge 
                      variant={getStatusVariant(invoice.status)}
                      className="text-xs"
                    >
                      {INVOICE_STATUS_LABELS[invoice.status]}
                    </Badge>
                  </div>
                </div>
                
                {invoice.fiken_url && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => window.open(invoice.fiken_url, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View in Fiken
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================================================================
// FINANCIAL EVENT CARD - Same as General Tab but without sync buttons
// =====================================================================================

interface FinancialEventCardProps {
  event: CalendarEvent;
  onRemoveEvent: () => void;
}

function FinancialEventCard({ event, onRemoveEvent }: FinancialEventCardProps) {
  // Get reactive pricing that automatically updates with variant changes
  const { data: pricingData } = useReactivePricing(event);
  
  // Get status pattern using unified system
  const statusPattern = statusUtils.getPattern(event.status as any);
  
  // Use reactive pricing if available, otherwise fall back to event data
  const displayPricing = pricingData || {
    equipment_price: event.equipment_price || 0,
    crew_price: event.crew_price || 0,
    total_price: event.total_price || 0
  };

  // Get location display
  function getDisplayLocation(location: string): { display: string; full: string } {
    const locationStr = location.trim();
    
    if (locationStr.includes(',')) {
      const parts = locationStr.split(',').map(p => p.trim());
      return {
        display: parts[0],
        full: locationStr
      };
    }
    
    return {
      display: locationStr,
      full: locationStr
    };
  }

  const locationInfo = getDisplayLocation(event.location || '');

  return (
    <div className="relative">
      <Card className={cn(
        "transition-all duration-200 hover:shadow-md border",
        statusPattern.cardBorder,
        statusPattern.cardBg
      )}>
        <EventGrid>
          {/* Date Column */}
          <EventGridColumns.Date>
            <div className="flex flex-col items-center text-center">
              <Calendar className="w-3 h-3 text-muted-foreground mb-1" />
              <span className="text-xs font-medium leading-tight">
                {formatDisplayDate(event.date)}
              </span>
            </div>
          </EventGridColumns.Date>

          {/* Event Details */}
          <EventGridColumns.Details>
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-sm leading-tight truncate">
                    {event.name}
                  </h3>
                  {locationInfo.display && (
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs text-muted-foreground truncate">
                        {locationInfo.display}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </EventGridColumns.Details>

          {/* Type */}
          <EventGridColumns.Type>
            {event.type && (
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs px-2 py-0.5 font-medium border-0",
                  EVENT_COLORS[event.type.color] || 'bg-muted text-muted-foreground'
                )}
              >
                {event.type.name}
              </Badge>
            )}
          </EventGridColumns.Type>

          {/* Variant */}
          <EventGridColumns.Variant>
            {event.variant_name && (
              <span className="text-xs text-muted-foreground font-medium truncate">
                {event.variant_name}
              </span>
            )}
          </EventGridColumns.Variant>

          {/* Equipment Icon - No sync button */}
          <EventGridColumns.Icon>
            <div className="flex items-center justify-center">
              <Package className="w-4 h-4 text-muted-foreground" />
            </div>
          </EventGridColumns.Icon>

          {/* Crew Icon - No sync button */}
          <EventGridColumns.Icon>
            <div className="flex items-center justify-center">
              <Users className="w-4 h-4 text-muted-foreground" />
            </div>
          </EventGridColumns.Icon>

          {/* Status */}
          <EventGridColumns.Status>
            <EventStatus 
              status={event.status}
              onStatusChange={() => {}} // No status change in financial tab
              disabled={true}
            />
          </EventGridColumns.Status>

          {/* Equipment Price */}
          <EventGridColumns.EquipmentPrice>
            <span className="text-xs font-medium text-right">
              {formatPrice(displayPricing.equipment_price)}
            </span>
          </EventGridColumns.EquipmentPrice>

          {/* Crew Price */}
          <EventGridColumns.CrewPrice>
            <span className="text-xs font-medium text-right">
              {formatPrice(displayPricing.crew_price)}
            </span>
          </EventGridColumns.CrewPrice>

          {/* Total */}
          <EventGridColumns.Total>
            <span className="text-sm font-bold text-right">
              {formatPrice(displayPricing.total_price)}
            </span>
          </EventGridColumns.Total>
        </EventGrid>
      </Card>

      {/* Remove button overlay */}
      <div className="absolute top-2 right-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemoveEvent}
          className="text-muted-foreground hover:text-destructive bg-background/80 backdrop-blur-sm"
        >
          Remove
        </Button>
      </div>
    </div>
  );
}

// =====================================================================================
// UTILITY FUNCTIONS
// =====================================================================================

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case 'paid':
      return 'default';
    case 'sent':
      return 'secondary';
    case 'overdue':
      return 'destructive';
    default:
      return 'outline';
  }
}