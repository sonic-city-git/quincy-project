import { Input } from "@/components/ui/input";

interface EquipmentSearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function EquipmentSearchInput({ value, onChange }: EquipmentSearchInputProps) {
  return (
    <Input
      placeholder="Search equipment..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-zinc-800/50"
    />
  );
}