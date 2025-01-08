import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface CrewSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function CrewSearch({ searchTerm, onSearchChange }: CrewSearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search crew..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-8 w-[200px]"
      />
    </div>
  );
}