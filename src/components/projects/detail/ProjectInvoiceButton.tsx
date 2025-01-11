import { Button } from "@/components/ui/button";
import { Receipt } from "lucide-react";

interface ProjectInvoiceButtonProps {
  onClick: () => void;
}

export function ProjectInvoiceButton({ onClick }: ProjectInvoiceButtonProps) {
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