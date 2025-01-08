import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TotalBookValueSectionProps {
  totalBookValue: string;
}

export function TotalBookValueSection({ totalBookValue }: TotalBookValueSectionProps) {
  return (
    <div className="grid gap-2">
      <Label className="text-base font-semibold">Total Book Value</Label>
      <Input
        type="text"
        value={totalBookValue}
        readOnly
        className="bg-background border-input text-foreground text-lg font-medium h-12"
      />
    </div>
  );
}