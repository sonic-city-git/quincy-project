import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserX } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

interface EmptyRole {
  id: string;
  role_name: string;
  event_date: string;
  project_name: string;
}

export function EmptyCrewRoles() {
  const { data: emptyRoles, isLoading } = useQuery({
    queryKey: ['empty-crew-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_event_roles')
        .select(`
          id,
          role:role_id(name),
          event:event_id(
            date,
            project:project_id(name)
          )
        `)
        .is('crew_member_id', null)
        .limit(5);

      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (!emptyRoles?.length) {
    return (
      <div className="text-muted-foreground">
        No empty crew roles found
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {emptyRoles.map((role) => (
        <Alert key={role.id} variant="warning">
          <UserX className="h-4 w-4" />
          <AlertDescription>
            Empty {role.role?.name} role on{' '}
            {new Date(role.event?.date).toLocaleDateString()} in project{' '}
            {role.event?.project?.name}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}

EmptyCrewRoles.Icon = UserX;