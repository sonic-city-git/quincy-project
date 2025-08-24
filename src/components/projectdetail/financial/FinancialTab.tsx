/**
 * 🧾 FINANCIAL TAB
 * 
 * Project financial management with Fiken integration
 * Redesigned to match QUINCY design system patterns
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { 
  FileText, 
  Send, 
  RefreshCw, 
  ExternalLink,
  AlertCircle,
  DollarSign,
  CreditCard
} from 'lucide-react';
import { useProjectInvoicing, useFikenConnection } from '@/hooks/invoice/useProjectInvoicing';
import { InvoiceWithDetails, Invoice } from '@/types/invoice';
import { Project } from '@/types/projects';
import { formatCurrency } from '@/utils/formatters';
import { INVOICE_STATUS_LABELS } from '@/types/invoice';
import { ProjectTabCard } from '../shared/ProjectTabCard';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { STATUS_COLORS } from '@/components/dashboard/shared/StatusCard';
import { cn } from '@/lib/utils';

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
  // -------------------------------------------------------------------------------------
  // EVENT HANDLERS
  // -------------------------------------------------------------------------------------

  const handleCreateInvoice = async () => {
    if (!projectDraft) return;
    
    setIsCreatingInvoice(true);
    try {
      await createInvoiceInFiken();
    } finally {
      setIsCreatingInvoice(false);
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
          actions={
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleSyncStatuses}
              disabled={isFikenLoading}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Sync Statuses
            </Button>
          }
        />

        {/* Connection Status */}
        {!isConnected && (
          <Alert className="border-yellow-200/20 bg-yellow-50/10">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="flex items-center justify-between">
              <span className="text-yellow-600">
                Fiken API: Not connected
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
        )}
        
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
            isCreatingInvoice={isCreatingInvoice}
            onCreateInvoice={handleCreateInvoice}
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
  isCreatingInvoice: boolean;
  onCreateInvoice: () => void;
  onRemoveEvent: (eventId: string) => void;
  invoiceReadyCount: number;
}

function AutoDraftInvoiceCard({
  projectDraft,
  isDraftLoading,
  isCreatingInvoice,
  onCreateInvoice,
  onRemoveEvent,
  invoiceReadyCount
}: AutoDraftInvoiceCardProps) {
  const hasEvents = projectDraft?.event_links && projectDraft.event_links.length > 0;
  const canCreateInvoice = hasEvents && projectDraft?.project?.customer;
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
          {canCreateInvoice && (
            <Button 
              onClick={onCreateInvoice}
              disabled={isCreatingInvoice}
              size="sm"
              className="bg-primary hover:bg-primary/90"
            >
              <Send className="w-4 h-4 mr-2" />
              {isCreatingInvoice ? 'Creating...' : 'Create in Fiken'}
            </Button>
          )}
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
                ? `${invoiceReadyCount} invoice-ready events will be auto-synced to draft`
                : 'Mark events as "invoice ready" to auto-add them here'
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

            {/* Events in Draft */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Events in Draft:</h4>
              {projectDraft?.event_links.map((link) => (
                <div key={link.id} className="flex items-center justify-between p-3 border border-border/50 rounded-lg bg-background/50">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{link.event.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(link.event.date).toLocaleDateString()} • 
                      {formatCurrency(link.event.total_price || 0)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveEvent(link.event_id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    Remove
                  </Button>
                </div>
              ))}
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