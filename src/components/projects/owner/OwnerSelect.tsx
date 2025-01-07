import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface OwnerSelectProps {
  projectId: string;
  initialOwner: string;
  onOwnerSelect?: (ownerId: string) => void;
}

export function OwnerSelect({ projectId, initialOwner, onOwnerSelect }: OwnerSelectProps) {
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

  const handleOwnerChange = async (newOwnerId: string) => {
    try {
      const crewMember = sonicCityCrewMembers.find(crew => crew.id === newOwnerId);
      if (!crewMember) {
        throw new Error('Selected crew member not found');
      }

      // Only update in Supabase if we have a valid projectId
      if (projectId && projectId.length > 0) {
        const { error } = await supabase
          .from('projects')
          .update({ owner_id: crewMember.id })
          .eq('id', projectId);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Project owner updated successfully",
        });
      }

      setSelectedOwner(crewMember.id);
      onOwnerSelect?.(crewMember.id);
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
        <SelectContent className="max-h-[200px]">
          <ScrollArea className="h-[200px]">
            {sonicCityCrewMembers.map((crew) => (
              <SelectItem key={crew.id} value={crew.id}>
                {crew.name}
              </SelectItem>
            ))}
          </ScrollArea>
        </SelectContent>
      </Select>
    </div>
  );
}