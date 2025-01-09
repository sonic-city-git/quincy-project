import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CrewMember, CrewRole } from "@/types/crew";
import { Card } from "@/components/ui/card";
import { RolesSection } from "./RolesSection";

interface ProjectCrewTabProps {
  projectId: string;
}

export function ProjectCrewTab({ projectId }: ProjectCrewTabProps) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <RolesSection projectId={projectId} />
      </Card>
    </div>
  );
}