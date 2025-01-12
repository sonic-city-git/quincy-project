import { formatPrice } from "@/utils/priceFormatters";

interface EventRevenueProps {
  revenue?: number;
}

export function EventRevenue({ revenue }: EventRevenueProps) {
  return (
    <div className="flex items-center justify-end text-sm">
      {formatPrice(revenue)}
    </div>
  );
}