import { Input } from "@/components/ui/input";

interface CrewSearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function CrewSearchInput({ value, onChange }: CrewSearchInputProps) {
  return (
    <Input
      placeholder="Search crew members..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-[200px] bg-zinc-800/50"
    />
  );
}