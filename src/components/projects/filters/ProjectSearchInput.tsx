import { Input } from "@/components/ui/input";

interface ProjectSearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function ProjectSearchInput({ value, onChange }: ProjectSearchInputProps) {
  return (
    <Input
      placeholder="Search projects..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-[200px] bg-zinc-800/50"
    />
  );
}