
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { syncExistingCrewData } from "@/utils/syncExistingCrewData";

interface SyncCrewDataButtonProps {
  projectId: string;
}

export function SyncCrewDataButton({ projectId }: SyncCrewDataButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleSync = async () => {
    setIsLoading(true);
    try {
      await syncExistingCrewData(projectId);
      
      // Invalidate queries to refresh the data
      await queryClient.invalidateQueries({ queryKey: ['events', projectId] });
      await queryClient.invalidateQueries({ queryKey: ['project-event-roles'] });
      
      toast.success('Crew data synchronized successfully');
    } catch (error) {
      console.error('Error syncing crew data:', error);
      toast.error('Failed to sync crew data');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleSync} 
      disabled={isLoading}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
      Sync Crew Data
    </Button>
  );
}
