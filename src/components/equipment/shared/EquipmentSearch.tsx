import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EquipmentSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function EquipmentSearch({ searchTerm, onSearchChange }: EquipmentSearchProps) {
  return (
    <div className="flex items-center">
      <Label htmlFor="search" className="sr-only">Search Equipment</Label>
      <Input
        id="search"
        type="text"
        placeholder="Search equipment..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full"
      />
    </div>
  );
}
