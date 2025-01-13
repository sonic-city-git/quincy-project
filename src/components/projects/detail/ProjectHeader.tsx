import { getColorStyles } from "@/utils/styleUtils";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProjectHeaderProps {
  name: string;
  color: string;
  projectNumber: number;
}

export function ProjectHeader({ name, color, projectNumber }: ProjectHeaderProps) {
  const formattedProjectNumber = String(projectNumber).padStart(4, '0');
  
  return (
    <div className="flex items-center justify-between gap-4 bg-zinc-800/45 p-6 rounded-lg">
      <div className="flex items-center gap-4">
        <div className="w-fit">
          <div 
            className="px-3.5 py-2 rounded-md font-medium"
            style={getColorStyles(color)}
          >
            <span className="text-3xl">{name}</span>
          </div>
        </div>
        <div className="text-lg text-muted-foreground">
          #{formattedProjectNumber}
        </div>
      </div>

      <TabsList className="bg-zinc-800/45 p-1 rounded-lg">
        <TabsTrigger 
          value="general" 
          className="data-[state=active]:bg-zinc-900/90 data-[state=active]:text-accent transition-colors"
        >
          General
        </TabsTrigger>
        <TabsTrigger 
          value="equipment"
          className="data-[state=active]:bg-zinc-900/90 data-[state=active]:text-accent transition-colors"
        >
          Equipment
        </TabsTrigger>
        <TabsTrigger 
          value="crew"
          className="data-[state=active]:bg-zinc-900/90 data-[state=active]:text-accent transition-colors"
        >
          Crew
        </TabsTrigger>
        <TabsTrigger 
          value="financial"
          className="data-[state=active]:bg-zinc-900/90 data-[state=active]:text-accent transition-colors"
        >
          Financial
        </TabsTrigger>
      </TabsList>
    </div>
  );
}