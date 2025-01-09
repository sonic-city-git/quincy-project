import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface RateInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function RateInput({
  id,
  label,
  value,
  onChange,
}: RateInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="after:content-['*'] after:ml-0.5 after:text-red-500">
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full"
      />
    </div>
  );
}