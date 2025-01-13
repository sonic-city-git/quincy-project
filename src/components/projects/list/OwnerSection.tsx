import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ProjectTable } from "../ProjectTable";
import { Project } from "@/types/projects";
import { getInitials } from "@/utils/stringUtils";

interface OwnerSectionProps {
  owner: {
    name: string;
    avatar_url?: string;
    projects: Project[];
  };
}

export function OwnerSection({ owner }: OwnerSectionProps) {
  return (
    <div>
      <div className="bg-zinc-800/50 px-4 py-2 font-medium text-sm text-zinc-400">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            {owner.avatar_url ? (
              <AvatarImage 
                src={owner.avatar_url} 
                alt={owner.name} 
                className="object-cover"
              />
            ) : (
              <AvatarFallback className="text-xs bg-zinc-800 text-zinc-400">
                {getInitials(owner.name)}
              </AvatarFallback>
            )}
          </Avatar>
          <span>{owner.name}</span>
        </div>
      </div>
      <ProjectTable projects={owner.projects} />
    </div>
  );
}