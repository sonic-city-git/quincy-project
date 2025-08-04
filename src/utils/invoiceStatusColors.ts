/**
 * Invoice Status Based Project Colors - Option 2
 * Colors convey critical business information with standardized text
 */

export interface ProjectInvoiceStatus {
  hasEvents: boolean;
  hasInvoiceReadyEvents: boolean;
  isFullyInvoiced: boolean;
  hasOverdueInvoices: boolean;
}

export interface InvoiceStatusScheme {
  name: string;
  description: string;
  background: string;
  accent: string; // For borders, highlights, and hover effects
}

/**
 * Invoice Status Color Schemes
 * Using design system CSS variables for consistency
 */
export const INVOICE_STATUS_SCHEMES = {
  no_events: {
    name: 'Planning',
    description: 'No events or only proposed events (not confirmed yet)',
    background: 'hsl(var(--primary) / 0.6)', // BOLD primary purple
    accent: 'hsl(var(--primary))'
  },
  
  active_events: {
    name: 'Active',
    description: 'Has confirmed events - committed work in progress',
    background: 'hsl(var(--primary) / 0.8)', // VIBRANT primary purple
    accent: 'hsl(var(--primary))'
  },
  
  invoice_ready: {
    name: 'Invoice Ready',
    description: 'Events completed, ready to invoice',
    background: 'hsl(var(--accent) / 0.85)', // STRONG accent orange - action needed!
    accent: 'hsl(var(--accent))'
  },
  
  invoiced: {
    name: 'Invoiced',
    description: 'All events invoiced',
    background: 'hsl(var(--secondary) / 0.7)', // PROMINENT secondary purple
    accent: 'hsl(var(--secondary))'
  },
  
  overdue: {
    name: 'Overdue',
    description: 'Invoicing overdue',
    background: 'hsl(var(--accent) / 0.9)', // MAXIMUM accent orange - urgent!
    accent: 'hsl(var(--destructive))'
  }
} as const;

/**
 * Determines project invoice status based on actual event data
 * Event statuses: 'proposed' | 'confirmed' | 'invoice ready' | 'invoiced' | 'cancelled'
 */
export function getProjectInvoiceStatus(
  events: Array<{ 
    status: 'proposed' | 'confirmed' | 'invoice ready' | 'invoiced' | 'cancelled';
    date?: Date | string;
    total_price?: number | null;
  }> = []
): keyof typeof INVOICE_STATUS_SCHEMES {
  
  // No events = planning stage
  if (!events || events.length === 0) {
    return 'no_events';
  }

  // Filter out cancelled events
  const activeEvents = events.filter(event => event.status !== 'cancelled');
  
  if (activeEvents.length === 0) {
    return 'no_events'; // All events cancelled = back to planning
  }

  // Check for overdue invoicing (invoice ready events older than 14 days)
  const now = new Date();
  const hasOverdue = activeEvents.some(event => {
    if (event.status === 'invoice ready' && event.date) {
      const eventDate = new Date(event.date);
      const daysSinceEvent = (now.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceEvent > 14; // Consider overdue after 14 days
    }
    return false;
  });
  
  if (hasOverdue) {
    return 'overdue';
  }

  // Check if ALL active events are invoiced
  const allInvoiced = activeEvents.every(event => event.status === 'invoiced');
  
  if (allInvoiced) {
    return 'invoiced';
  }

  // Check for any invoice ready events (highest priority action)
  const hasInvoiceReady = activeEvents.some(event => event.status === 'invoice ready');
  
  if (hasInvoiceReady) {
    return 'invoice_ready';
  }

  // Check for confirmed events (committed work)
  const hasConfirmedEvents = activeEvents.some(event => event.status === 'confirmed');
  
  if (hasConfirmedEvents) {
    return 'active_events';
  }

  // Only proposed events = still in planning/negotiation
  return 'no_events';
}

/**
 * Gets CSS styles for invoice status scheme with standardized text
 */
export function getInvoiceStatusStyles(statusKey: keyof typeof INVOICE_STATUS_SCHEMES) {
  const scheme = INVOICE_STATUS_SCHEMES[statusKey];
  
  return {
    backgroundColor: scheme.background,
    color: 'hsl(var(--foreground))', // Standardized text color
    border: '1px solid hsl(var(--border))', // Standardized border
  } as React.CSSProperties;
}

/**
 * Gets the accent color for highlights and borders
 */
export function getInvoiceStatusAccent(statusKey: keyof typeof INVOICE_STATUS_SCHEMES): string {
  return INVOICE_STATUS_SCHEMES[statusKey].accent;
}

/**
 * Temporary status determination using project data for demo
 * TODO: Replace with actual event data from useConsolidatedEvents
 */
export function getSimplifiedProjectStatus(project: any): keyof typeof INVOICE_STATUS_SCHEMES {
  // Use project ID to create consistent variety for demo
  const projectNumber = project.project_number || 1000;
  const statusIndex = projectNumber % 5;
  
  switch (statusIndex) {
    case 0: return 'no_events';
    case 1: return 'active_events';
    case 2: return 'invoice_ready';
    case 3: return 'invoiced';
    case 4: return 'overdue';
    default: return 'active_events';
  }
}