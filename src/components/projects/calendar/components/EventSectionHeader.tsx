import { HelpCircle, CheckCircle, Send, XCircle } from "lucide-react";

interface EventSectionHeaderProps {
  title: string;
  eventCount: number;
}

export function EventSectionHeader({ title, eventCount }: EventSectionHeaderProps) {
  const getStatusIcon = () => {
    switch (title.toLowerCase()) {
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'invoice ready':
        return <Send className="h-5 w-5 text-blue-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default: // 'proposed'
        return <HelpCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  return (
    <div className="flex items-center gap-2">
      {getStatusIcon()}
      <h3 className="text-lg font-semibold">{title}</h3>
      <span className="text-sm text-muted-foreground">({eventCount})</span>
    </div>
  );
}