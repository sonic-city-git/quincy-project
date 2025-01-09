import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface RateInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function RateInput({
  id,
  label,
  value,
  onChange,
  error
}: RateInputProps) {
  return (
    <div className="space-y-2">
      <Label 
        htmlFor={id}
        className="after:content-['*'] after:ml-0.5 after:text-red-500"
      >
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Enter ${label.toLowerCase()}`}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}