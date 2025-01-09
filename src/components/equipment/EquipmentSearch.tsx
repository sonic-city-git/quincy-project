import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface EquipmentSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function EquipmentSearch({ searchTerm, onSearchChange }: EquipmentSearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search equipment..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-8 h-9"
      />
    </div>
  );
}