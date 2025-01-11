import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEquipment } from "@/hooks/useEquipment";
import { Equipment } from "@/integrations/supabase/types/equipment";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface EquipmentSelectorProps {
  onSelect: (equipment: Equipment) => void;
  className?: string;
}

export function EquipmentSelector({ onSelect, className }: EquipmentSelectorProps) {
  const [search, setSearch] = useState("");
  const { equipment = [], loading } = useEquipment();

  const filteredEquipment = equipment.filter(item => 
    item.name?.toLowerCase().includes(search.toLowerCase()) ||
    item.code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={cn("space-y-4", className)}>
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search equipment..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-2 pr-4">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading equipment...</div>
          ) : filteredEquipment.length === 0 ? (
            <div className="text-sm text-muted-foreground">No equipment found</div>
          ) : (
            filteredEquipment.map((item) => (
              <Button
                key={item.id}
                variant="outline"
                className="w-full justify-start"
                onClick={() => onSelect(item)}
              >
                <div className="text-left">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-muted-foreground">{item.code || '-'}</div>
                </div>
              </Button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}