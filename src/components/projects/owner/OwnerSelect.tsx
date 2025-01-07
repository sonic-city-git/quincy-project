import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface OwnerSelectProps {
  projectId: string;
  initialOwner: string;
}

export function OwnerSelect({ projectId, initialOwner }: OwnerSelectProps) {
  const [sonicCityCrewMembers, setSonicCityCrewMembers] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedOwner, setSelectedOwner] = useState(initialOwner);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSonicCityCrewMembers = async () => {
      try {
        const { data, error } = await supabase
          .from('crew_members')
          .select('id, name')
          .eq('folder', 'Sonic City');

        if (error) throw error;
        setSonicCityCrewMembers(data || []);
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

  const handleOwnerChange = async (newOwnerName: string) => {
    try {
      const crewMember = sonicCityCrewMembers.find(crew => crew.name === newOwnerName);
      if (!crewMember) {
        throw new Error('Selected crew member not found');
      }

      const { error } = await supabase
        .from('projects')
        .update({ owner_id: crewMember.id })
        .eq('id', projectId);

      if (error) throw error;

      setSelectedOwner(newOwnerName);
      
      toast({
        title: "Success",
        description: "Project owner updated successfully",
      });
    } catch (error) {
      console.error('Error updating project owner:', error);
      toast({
        title: "Error",
        description: "Failed to update project owner",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Owner</p>
      <Select value={selectedOwner} onValueChange={handleOwnerChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select owner" />
        </SelectTrigger>
        <SelectContent>
          {sonicCityCrewMembers.map((crew) => (
            <SelectItem key={crew.id} value={crew.name}>
              {crew.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}