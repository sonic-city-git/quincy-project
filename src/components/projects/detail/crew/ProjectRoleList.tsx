import { useProjectRoles } from "@/hooks/useProjectRoles";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface ProjectRoleListProps {
  projectId: string;
}

export function ProjectRoleList({ projectId }: ProjectRoleListProps) {
  const { roles, loading } = useProjectRoles(projectId);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (roles.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No roles added yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {roles.map((role) => (
        <Card key={role.id} className="p-4 bg-zinc-900/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">{role.role.name}</h3>
              <div className="text-sm text-muted-foreground">
                Daily Rate: ${role.daily_rate} • Hourly Rate: ${role.hourly_rate}
              </div>
              {role.preferred && (
                <div className="text-sm text-muted-foreground mt-1">
                  Preferred: {role.preferred.name}
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}