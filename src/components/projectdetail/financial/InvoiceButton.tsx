import { Button } from "@/components/ui/button";
import { Receipt } from "lucide-react";

interface InvoiceButtonProps {
  onClick: () => void;
}

export function InvoiceButton({ onClick }: InvoiceButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={onClick}
    >
      <Receipt className="h-4 w-4" />
      Invoice
    </Button>
  );
}