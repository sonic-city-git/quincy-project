/**
 * 🧾 FINANCIAL TAB
 * 
 * Project financial management with Fiken integration
 * Displays auto-draft invoice, invoice-ready events, and sent invoices
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Plus, 
  Send, 
  RefreshCw, 
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign
} from 'lucide-react';
import { useProjectInvoicing, useFikenConnection } from '@/hooks/invoice/useProjectInvoicing';
import { InvoiceWithDetails, Invoice } from '@/types/invoice';
import { CalendarEvent } from '@/types/events';
import { Project } from '@/types/projects';
import { formatCurrency } from '@/utils/formatters';
import { INVOICE_STATUS_LABELS } from '@/types/invoice';

// =====================================================================================
// MAIN COMPONENT
// =====================================================================================

interface FinancialTabProps {
  project: Project;
  projectId: string;
}

export function FinancialTab({ project, projectId }: FinancialTabProps) {
  const {
    projectDraft,
    fikenInvoices,
    invoiceReadyEvents,
    isDraftLoading,
    isFikenLoading,
    isEventsLoading,
    createInvoiceInFiken,
    addEventsToProjectDraft,
    removeEventFromDraft,
    syncInvoiceStatuses,
    error
  } = useProjectInvoicing(projectId);

  const { isConnected, testConnection } = useFikenConnection();

  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  // -------------------------------------------------------------------------------------
  // EVENT HANDLERS
  // -------------------------------------------------------------------------------------

  const handleCreateInvoice = async () => {
    if (!projectDraft) return;
    
    setIsCreatingInvoice(true);
    try {
      await createInvoiceInFiken();
      setSelectedEvents([]);
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  const handleAddEvents = async () => {
    if (selectedEvents.length === 0) return;
    
    try {
      await addEventsToProjectDraft(selectedEvents);
      setSelectedEvents([]);
    } catch (error) {
      console.error('Error adding events:', error);
    }
  };

  const handleRemoveEvent = async (eventId: string) => {
    try {
      await removeEventFromDraft(eventId);
    } catch (error) {
      console.error('Error removing event:', error);
    }
  };

  const handleSyncStatuses = async () => {
    try {
      await syncInvoiceStatuses();
    } catch (error) {
      console.error('Error syncing statuses:', error);
    }
  };

  const toggleEventSelection = (eventId: string) => {
    setSelectedEvents(prev => 
      prev.includes(eventId) 
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  // -------------------------------------------------------------------------------------
  // RENDER HELPERS
  // -------------------------------------------------------------------------------------

  const renderConnectionStatus = () => (
    <Alert className={isConnected ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>
          Fiken API: {isConnected ? 'Connected' : 'Not connected'}
        </span>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => testConnection()}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Test Connection
        </Button>
      </AlertDescription>
    </Alert>
  );

  const renderError = () => {
    if (!error) return null;
    
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error.message}
        </AlertDescription>
      </Alert>
    );
  };

  // -------------------------------------------------------------------------------------
  // MAIN RENDER
  // -------------------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Financial Management</h2>
          <p className="text-muted-foreground">
            Manage invoicing for {project.name}
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleSyncStatuses}
          disabled={isFikenLoading}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Sync Statuses
        </Button>
      </div>

      {/* Connection Status */}
      {renderConnectionStatus()}
      
      {/* Error Display */}
      {renderError()}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Auto-Draft Invoice */}
        <div className="space-y-6">
          <AutoDraftInvoiceCard
            projectDraft={projectDraft}
            isDraftLoading={isDraftLoading}
            isCreatingInvoice={isCreatingInvoice}
            onCreateInvoice={handleCreateInvoice}
            onRemoveEvent={handleRemoveEvent}
          />

          <InvoiceReadyEventsCard
            events={invoiceReadyEvents}
            isEventsLoading={isEventsLoading}
            selectedEvents={selectedEvents}
            onToggleEvent={toggleEventSelection}
            onAddEvents={handleAddEvents}
            hasSelection={selectedEvents.length > 0}
          />
        </div>

        {/* Right Column: Sent Invoices */}
        <div>
          <FikenInvoicesCard
            invoices={fikenInvoices}
            isFikenLoading={isFikenLoading}
          />
        </div>
      </div>
    </div>
  );
}

// =====================================================================================
// SUB-COMPONENTS
// =====================================================================================

interface AutoDraftInvoiceCardProps {
  projectDraft: InvoiceWithDetails | null;
  isDraftLoading: boolean;
  isCreatingInvoice: boolean;
  onCreateInvoice: () => void;
  onRemoveEvent: (eventId: string) => void;
}

function AutoDraftInvoiceCard({
  projectDraft,
  isDraftLoading,
  isCreatingInvoice,
  onCreateInvoice,
  onRemoveEvent
}: AutoDraftInvoiceCardProps) {
  if (isDraftLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Draft Invoice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasEvents = projectDraft?.event_links && projectDraft.event_links.length > 0;
  const canCreateInvoice = hasEvents && projectDraft?.project?.customer;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Draft Invoice
          </div>
          {canCreateInvoice && (
            <Button 
              onClick={onCreateInvoice}
              disabled={isCreatingInvoice}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="w-4 h-4 mr-2" />
              {isCreatingInvoice ? 'Creating...' : 'Create in Fiken'}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasEvents ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No events in draft invoice</p>
            <p className="text-sm">Add "invoice ready" events to create an invoice</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Customer Info */}
            {projectDraft?.project?.customer && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">{projectDraft.project.customer.name}</p>
                {projectDraft.project.customer.organization_number && (
                  <p className="text-sm text-muted-foreground">
                    Org: {projectDraft.project.customer.organization_number}
                  </p>
                )}
              </div>
            )}

            {/* Events in Draft */}
            <div className="space-y-2">
              <h4 className="font-medium">Events in Draft:</h4>
              {projectDraft?.event_links.map((link) => (
                <div key={link.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <p className="font-medium">{link.event.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(link.event.date).toLocaleDateString()} • 
                      {formatCurrency(link.event.total_price || 0)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveEvent(link.event_id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>

            {/* Total */}
            <Separator />
            <div className="flex justify-between items-center font-bold">
              <span>Total:</span>
              <span>{formatCurrency(projectDraft?.total_amount || 0)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface InvoiceReadyEventsCardProps {
  events: CalendarEvent[];
  isEventsLoading: boolean;
  selectedEvents: string[];
  onToggleEvent: (eventId: string) => void;
  onAddEvents: () => void;
  hasSelection: boolean;
}

function InvoiceReadyEventsCard({
  events,
  isEventsLoading,
  selectedEvents,
  onToggleEvent,
  onAddEvents,
  hasSelection
}: InvoiceReadyEventsCardProps) {
  if (isEventsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invoice Ready Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Invoice Ready Events
          </div>
          {hasSelection && (
            <Button onClick={onAddEvents} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Selected ({selectedEvents.length})
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No events ready for invoicing</p>
            <p className="text-sm">Events with status "invoice ready" will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {events.map((event) => (
              <div 
                key={event.id} 
                className={`p-3 border rounded cursor-pointer transition-colors ${
                  selectedEvents.includes(event.id) 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => onToggleEvent(event.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{event.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(event.total_price || 0)}</p>
                    <Badge variant="secondary" className="text-xs">
                      {event.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface FikenInvoicesCardProps {
  invoices: Invoice[];
  isFikenLoading: boolean;
}

function FikenInvoicesCard({ invoices, isFikenLoading }: FikenInvoicesCardProps) {
  if (isFikenLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fiken Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <DollarSign className="w-5 h-5 mr-2" />
          Fiken Invoices
        </CardTitle>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No invoices sent yet</p>
            <p className="text-sm">Created invoices will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="p-3 border rounded">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium">
                      {invoice.fiken_invoice_number || `Invoice ${invoice.id.slice(0, 8)}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(invoice.invoice_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
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
      </CardContent>
    </Card>
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