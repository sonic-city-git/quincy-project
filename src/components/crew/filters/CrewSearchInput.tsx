import { Input } from "@/components/ui/input";

interface CrewSearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function CrewSearchInput({ value, onChange }: CrewSearchInputProps) {
  return (
    <div className="w-[200px]">
      <Input
        placeholder="Search crew members..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-zinc-800/50"
      />
    </div>
  );
}