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
import { EventGrid, EventGridColumns, EventTableHeader } from '../general/events/layout/EventGrid';
import { EventStatus } from '../general/events/components/EventStatus';
import { EventContent } from '../general/events/layout/EventContent';
import { useEventsWithReactivePricing } from '@/services/pricing/hooks';
import { getEventTypeColorStyle } from '../general/events/EventCard';
import { COMPONENT_CLASSES } from '@/design-system';


import { EVENT_COLORS } from '@/constants/eventColors';
import { formatDisplayDate } from '@/utils/dateFormatters';
import { formatPrice } from '@/utils/priceFormatters';
import { statusUtils } from '@/constants/eventStatus';
import { Calendar, MapPin, Package, Users } from 'lucide-react';
import { useReactivePricing } from '@/services/pricing/hooks';
import { useFikenInvoiceSync } from '@/hooks/invoice/useFikenInvoiceSync';

// =====================================================================================
// MAIN COMPONENT
// =====================================================================================

interface FinancialTabProps {
  project: Project;
  projectId: string;
}

export function FinancialTab({ project, projectId }: FinancialTabProps) {
  const queryClient = useQueryClient();
  const { syncProjectInvoices } = useFikenInvoiceSync();
  
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

  // Auto-refresh: The useProjectInvoicing hook already has proper refresh settings
  // (staleTime: 0, refetchOnWindowFocus: true, refetchOnMount: true)

  // Sync with Fiken when tab is opened
  useEffect(() => {
    if (projectId) {
      syncProjectInvoices(projectId);
    }
  }, [projectId, syncProjectInvoices]);

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
        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Two Column Layout - Same as General Tab */}
        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-[320px_1fr] lg:grid-cols-[360px_1fr] xl:grid-cols-[400px_1fr] gap-3 md:gap-4 h-[calc(100vh-150px)] min-h-[650px] max-h-[950px] overflow-hidden">
          {/* Left Column - Sent Invoices (Fixed Width) */}
          <div className="flex flex-col gap-4">
            <FikenInvoicesCard
              invoices={fikenInvoices}
              isFikenLoading={isFikenLoading}
            />
          </div>

          {/* Right Column - Draft Events (Flexible Width) */}
          <div className={cn(
            'flex flex-col h-full overflow-hidden',
            'bg-gradient-to-br', STATUS_COLORS.info.bg,
            'border', STATUS_COLORS.info.border,
            'rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200'
          )}>
            {/* Events Content Header - matching General tab pattern */}
            <div className="px-3 py-2.5 border-b border-border/20 flex-shrink-0">
              <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-lg text-foreground">Invoice Ready Events</h2>
              <Badge variant="outline" className="text-xs">
                Auto-synced
              </Badge>
            </div>
              </div>
            </div>

            {/* Events Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="p-3">
                <AutoDraftInvoiceContent
                  projectDraft={projectDraft}
                  isDraftLoading={isDraftLoading}
                  onRemoveEvent={handleRemoveEvent}
                  invoiceReadyCount={invoiceReadyEvents.length}
                  projectId={projectId}
                />
              </div>
            </div>
          </div>
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
  projectId: string;
}

interface AutoDraftInvoiceContentProps {
  projectDraft: InvoiceWithDetails | null;
  isDraftLoading: boolean;
  onRemoveEvent: (eventId: string) => void;
  invoiceReadyCount: number;
  projectId: string;
}

function AutoDraftInvoiceCard({
  projectDraft,
  isDraftLoading,
  onRemoveEvent,
  invoiceReadyCount,
  projectId
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
            <h3 className="font-semibold text-lg">Events in Draft</h3>
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
                <div className="space-y-0">
                  {/* Table Header - Same as General Tab */}
                  <EventTableHeader />
                  
                  {/* Event Cards */}
                  <div className="space-y-1">
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
                        <FinancialEventCard 
                          key={link.id}
                          event={calendarEvent}
                        />
                      );
                    })}
                  </div>
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

function AutoDraftInvoiceContent({
  projectDraft,
  isDraftLoading,
  onRemoveEvent,
  invoiceReadyCount,
  projectId
}: AutoDraftInvoiceContentProps) {
  const hasEvents = projectDraft?.event_links && projectDraft.event_links.length > 0;

  if (isDraftLoading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-muted rounded w-3/4"></div>
        <div className="h-4 bg-muted rounded w-1/2"></div>
      </div>
    );
  }

  if (!hasEvents) {
    return (
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
    );
  }

  // Convert event links to CalendarEvent format
  const events: CalendarEvent[] = projectDraft?.event_links.map((link) => ({
    id: link.event.id,
    name: link.event.name,
    date: new Date(link.event.date),
    status: link.event.status as CalendarEvent['status'],
    type: link.event.event_types || link.event.type,
    variant_name: link.event.project_variants?.variant_name || 'default',
    location: link.event.location || '',
    equipment_price: link.event.equipment_price || 0,
    crew_price: link.event.crew_price || 0,
    total_price: link.event.total_price || 0,
    project_id: projectId,
    event_type_id: link.event.event_type_id || '',
    variant_id: link.event.variant_id || '',
    created_at: link.event.created_at || new Date().toISOString(),
    updated_at: link.event.updated_at || new Date().toISOString()
  })) || [];

  // Get events with reactive pricing - same as General Tab
  const { events: eventsWithPricing } = useEventsWithReactivePricing(events);

  // Calculate totals using reactive pricing - same as General Tab
  const totalEquipmentPrice = eventsWithPricing.reduce((sum, event) => {
    return sum + (event.equipment_price || 0);
  }, 0);
  
  const totalCrewPrice = eventsWithPricing.reduce((sum, event) => {
    return sum + (event.crew_price || 0);
  }, 0);
  
  const totalPrice = eventsWithPricing.reduce((sum, event) => {
    return sum + (event.total_price || 0);
  }, 0);

  return (
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

      {/* Events Section - Same structure as General Tab */}
      <div className={cn(
        'rounded-lg overflow-hidden',
        'bg-background border border-border',
        'shadow-sm hover:shadow-md transition-shadow duration-200'
      )}>
        {/* Table Header - Financial Tab specific (no Equipment/Crew/Status columns) */}
        <FinancialEventTableHeader />
        
        {/* Event Content with proper spacing - Same as General Tab */}
        <EventContent variant="list" spacing="sm" className="overflow-hidden mt-1">
          {eventsWithPricing.map((event) => (
            <FinancialEventCard 
              key={event.id}
              event={event}
            />
          ))}
          
          {/* Enhanced Summary Row - Same as General Tab */}
          {eventsWithPricing.length > 0 && (totalEquipmentPrice > 0 || totalCrewPrice > 0 || totalPrice > 0) && (
            <FinancialEventSectionSummary
              title="Draft Total"
              totalEquipment={totalEquipmentPrice}
              totalCrew={totalCrewPrice}
              totalPrice={totalPrice}
              eventCount={events.length}
              variant="info"
            />
          )}
        </EventContent>
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
// FINANCIAL GRID - Simplified version without Equipment/Crew/Status columns
// =====================================================================================

// Financial Tab grid - 7 columns instead of 10 (removed Equipment, Crew, Status icons)
// Much more breathing room for remaining columns
const FINANCIAL_GRID_COLUMNS = {
  // Mobile: 4 columns - [Date, Event, Equipment €, Total €] - More space for event details
  mobile: 'grid-cols-[80px_minmax(160px,1fr)_80px_90px]',
  // Small: 5 columns - Add Type [Date, Event, Type, Equipment €, Total €] - Generous spacing
  small: 'sm:grid-cols-[90px_minmax(180px,1fr)_minmax(100px,1fr)_90px_100px]',
  // Tablet: 7 columns - Add Variant and Crew € [Date, Event, Type, Variant, Equipment €, Crew €, Total €] - Maximum breathing room
  tablet: 'md:grid-cols-[100px_minmax(200px,1fr)_minmax(120px,1fr)_minmax(100px,1fr)_100px_100px_110px]'
} as const;

function FinancialEventGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      'grid', 
      FINANCIAL_GRID_COLUMNS.mobile, 
      FINANCIAL_GRID_COLUMNS.small, 
      FINANCIAL_GRID_COLUMNS.tablet,
      'gap-1 items-center min-h-[40px] px-2 py-1.5',
      'sm:gap-2 sm:px-3 sm:py-2',
      'md:gap-3 md:px-4 md:py-2.5',
      'transition-all duration-200 ease-in-out',
      'w-full overflow-hidden',
      className
    )}>
      {children}
    </div>
  );
}

function FinancialEventTableHeader({ className }: { className?: string }) {
  return (
    <div className={cn(
      'bg-gradient-to-r from-muted/40 to-muted/60',
      'border-b-2 border-border/30',
      'backdrop-blur-sm',
      className
    )}>
      <div className={cn(
        'grid', 
        FINANCIAL_GRID_COLUMNS.mobile, 
        FINANCIAL_GRID_COLUMNS.small, 
        FINANCIAL_GRID_COLUMNS.tablet,
        // Use EXACT same spacing as FinancialEventGrid
        'gap-1 items-center min-h-[40px] px-2 py-1.5',
        'sm:gap-2 sm:px-3 sm:py-2',
        'md:gap-3 md:px-4 md:py-2.5',
        'text-sm font-semibold text-foreground/90 tracking-wide'
      )}>
        <div>Date</div>
        <div>Event</div>
        <div className="hidden sm:block">Type</div>
        <div className="hidden md:block">Variant</div>
        <div className="text-right hidden sm:block">Equipment</div>
        <div className="text-right hidden md:block">Crew</div>
        <div className="text-right font-bold">Total</div>
      </div>
    </div>
  );
}

// =====================================================================================
// FINANCIAL EVENT SECTION SUMMARY - Same as General Tab
// =====================================================================================

function FinancialEventSectionSummary({
  title,
  totalEquipment,
  totalCrew,
  totalPrice,
  eventCount,
  variant = 'info'
}: {
  title: string;
  totalEquipment: number;
  totalCrew: number;
  totalPrice: number;
  eventCount: number;
  variant?: 'warning' | 'success' | 'info' | 'critical' | 'operational';
}) {
  // Use design system status colors - same as General Tab
  const statusColors = STATUS_COLORS[variant] || STATUS_COLORS.info;

  return (
    <div className={cn(
      'mt-4 rounded-lg shadow-sm border',
      'bg-gradient-to-br', statusColors.bg,
      statusColors.border
    )}>
      <FinancialEventGrid>
        {/* Date Column - Total text */}
        <div className="font-bold text-sm text-foreground tracking-wide">
          {title}
        </div>
        
        {/* Event Column - empty */}
        <div></div>
        
        {/* Type Badge Column - empty, only on small+ to match grid */}
        <div className="hidden sm:block"></div>
        
        {/* Variant Column - empty, only on tablet+ to match grid */}
        <div className="hidden md:block"></div>
        
        {/* Equipment Price - Show from small screens (640px+) to match event cards */}
        <div className="hidden sm:flex items-center text-xs tabular-nums font-medium whitespace-nowrap justify-end text-foreground font-bold">
          {formatPrice(totalEquipment)}
        </div>
        
        {/* Crew Price - Show from tablet (768px+) to match event cards */}
        <div className="hidden md:flex items-center text-xs tabular-nums font-medium whitespace-nowrap justify-end text-foreground font-bold">
          {formatPrice(totalCrew)}
        </div>
        
        {/* Total Price - HIGHEST PRIORITY, always visible */}
        <div className="flex items-center text-xs tabular-nums font-medium whitespace-nowrap justify-end text-foreground font-bold">
          {formatPrice(totalPrice)}
        </div>
      </FinancialEventGrid>
    </div>
  );
}

// =====================================================================================
// FINANCIAL EVENT CARD - Same as General Tab but without sync buttons
// =====================================================================================

interface FinancialEventCardProps {
  event: CalendarEvent;
}

function FinancialEventCard({ event }: FinancialEventCardProps) {
  // 🔄 Get reactive pricing that automatically updates with variant changes - Same as General Tab
  const { data: pricingData } = useReactivePricing(event);
  
  // Get status pattern using unified system - Same as General Tab
  const statusPattern = statusUtils.getPattern(event.status as any);
  
  // Get event type color styling - Same as General Tab
  const getTypeColorStyle = () => {
    return getEventTypeColorStyle(event.type);
  };

  return (
    <TooltipProvider>
      <Card 
        className={cn(
          COMPONENT_CLASSES.card.hover,
          'transition-all duration-200 ease-in-out group',
          statusPattern.bg,
          statusPattern.border && `border-l-4 ${statusPattern.border}`,
          'mb-0.5 shadow-sm hover:shadow-md',
          'overflow-hidden' // Prevent card overflow
        )}
      >
        <FinancialEventGrid>
          {/* Date */}
          <div className="flex items-center gap-2 text-xs font-medium whitespace-nowrap text-muted-foreground/80">
            <Calendar className="h-3 w-3 flex-shrink-0" />
            <span className="font-medium text-xs">
              {formatDisplayDate(event.date)}
            </span>
          </div>
          
          {/* Event Name & Location */}
          <div className="flex flex-col justify-center gap-0.5 w-full overflow-hidden min-w-0">
            <div className="space-y-0.5 w-full overflow-hidden min-w-0">
              <h4 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                {event.name}
              </h4>
              {event.location && (
                <p className="text-xs text-muted-foreground truncate flex items-center gap-0.5">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  {event.location}
                </p>
              )}
            </div>
          </div>
          
          {/* Event Type Badge - Available from small screens (640px+) */}
          <div className="hidden sm:flex items-center px-0.5 overflow-hidden">
            {event.type && (
              <span className={cn(
                'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold flex-shrink-0',
                'transition-all duration-200',
                getTypeColorStyle()
              )}>
                {event.type.name}
              </span>
            )}
          </div>

          {/* Variant - Available from tablet (768px+) */}
          <div className="hidden md:flex items-center overflow-hidden">
            {event.variant_name && event.variant_name !== 'default' ? (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-muted/50 text-muted-foreground border border-border/50 flex-shrink-0">
                {event.variant_name}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground/60 font-semibold flex-shrink-0">
                default
              </span>
            )}
          </div>

          {/* Equipment Price - Show from small screens (640px+) */}
          <div className="hidden sm:flex items-center text-xs tabular-nums font-medium whitespace-nowrap justify-end text-muted-foreground">
            {formatPrice(pricingData?.equipment_price ?? event.equipment_price)}
          </div>

          {/* Crew Price - Show from tablet (768px+) */}
          <div className="hidden md:flex items-center text-xs tabular-nums font-medium whitespace-nowrap justify-end text-muted-foreground">
            {formatPrice(pricingData?.crew_price ?? event.crew_price)}
          </div>

          {/* Total Price - HIGHEST PRIORITY, always visible */}
          <div className="flex items-center text-xs tabular-nums font-medium whitespace-nowrap justify-end text-foreground font-bold">
            {formatPrice(pricingData?.total_price ?? event.total_price)}
          </div>
        </FinancialEventGrid>
      </Card>
    </TooltipProvider>
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