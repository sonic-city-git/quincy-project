import { RefreshCw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSyncCrewAvatars } from "@/hooks/useSyncCrewAvatars";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SyncAvatarsButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  showText?: boolean;
}

export function SyncAvatarsButton({ 
  variant = "outline", 
  size = "sm", 
  showText = false 
}: SyncAvatarsButtonProps) {
  const { syncAllAvatars, isLoading } = useSyncCrewAvatars();

  const handleSync = () => {
    syncAllAvatars();
  };

  const buttonContent = (
    <Button
      variant={variant}
      size={size}
      onClick={handleSync}
      disabled={isLoading}
      className="gap-2"
    >
      {isLoading ? (
        <RefreshCw className="h-4 w-4 animate-spin" />
      ) : (
        <Users className="h-4 w-4" />
      )}
      {showText && (isLoading ? "Syncing..." : "Sync Avatars")}
    </Button>
  );

  if (!showText) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {buttonContent}
          </TooltipTrigger>
          <TooltipContent>
            <p>Sync crew member avatars from Google Auth</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return buttonContent;
}