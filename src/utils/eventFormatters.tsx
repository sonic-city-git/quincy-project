import { CalendarEvent } from "@/types/events";
import { CheckCircle, HelpCircle, Send, XCircle, DollarSign } from "lucide-react";

export const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'confirmed':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'invoice ready':
      return <Send className="h-5 w-5 text-blue-500" />;
    case 'invoiced':
      return <DollarSign className="h-5 w-5 text-emerald-500" />;
    case 'cancelled':
      return <XCircle className="h-5 w-5 text-red-500" />;
    default: // 'proposed'
      return <HelpCircle className="h-5 w-5 text-yellow-500" />;
  }
};

export const getStatusText = (status: string) => {
  if (status === 'invoice_ready') return 'Invoice Ready';
  return status.charAt(0).toUpperCase() + status.slice(1);
};

export const formatRevenue = (revenue: number | undefined) => {
  if (revenue === undefined || revenue === null) return '-';
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(revenue);
};