import { Separator } from "@/components/ui/separator";

interface FinancialInfoProps {
  gigPrice: string;
  yearlyRevenue: string;
}

export function FinancialInfo({ gigPrice, yearlyRevenue }: FinancialInfoProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Gig Price</p>
        <p className="text-base font-medium">{gigPrice}</p>
      </div>
      <Separator className="my-2" />
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Yearly Revenue</p>
        <p className="text-base font-medium">{yearlyRevenue}</p>
      </div>
    </div>
  );
}