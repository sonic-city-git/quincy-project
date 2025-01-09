import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface OwnerSelectProps {
  selectedOwnerId: string;
  onOwnerSelect: (ownerId: string) => void;
}

export function OwnerSelect({ selectedOwnerId, onOwnerSelect }: OwnerSelectProps) {
  const [sonicCityCrewMembers, setSonicCityCrewMembers] = useState<Array<{ id: string; name: string }>>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSonicCityCrewMembers = async () => {
      try {
        console.log('Fetching Sonic City crew members...');
        const { data, error } = await supabase
          .from('crew_members')
          .select('id, name, crew_folder')
          .eq('crew_folder->data->name', 'Sonic City');

        if (error) throw error;

        // Filter out any null results and map to the required format
        const validMembers = (data || [])
          .filter(member => member && member.id && member.name)
          .map(({ id, name }) => ({ id, name }));

        console.log('Fetched crew members:', validMembers);
        setSonicCityCrewMembers(validMembers);
      } catch (error) {
        console.error('Error fetching Sonic City crew members:', error);
        toast({
          title: "Error",
          description: "Failed to fetch crew members",
          variant: "destructive",
        });
      }
    };

    fetchSonicCityCrewMembers();
  }, [toast]);

  return (
    <Select
      value={selectedOwnerId}
      onValueChange={onOwnerSelect}
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select owner" />
      </SelectTrigger>
      <SelectContent>
        {sonicCityCrewMembers && sonicCityCrewMembers.length > 0 ? (
          sonicCityCrewMembers.map((crew) => (
            <SelectItem key={crew.id} value={crew.id}>
              {crew.name}
            </SelectItem>
          ))
        ) : (
          <SelectItem value="no-data" disabled>
            No crew members found
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}