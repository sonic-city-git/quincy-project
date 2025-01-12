import { getColorStyles } from "@/utils/styleUtils";

interface ProjectHeaderProps {
  name: string;
  color: string;
  projectNumber: number;
}

export function ProjectHeader({ name, color, projectNumber }: ProjectHeaderProps) {
  const formattedProjectNumber = String(projectNumber).padStart(4, '0');
  
  return (
    <div className="flex items-center gap-4 bg-zinc-800/45 p-6 rounded-lg mb-6">
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
  );
}