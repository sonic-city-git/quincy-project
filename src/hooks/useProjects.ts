import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Project } from "@/types/projects";
import { useToast } from "@/hooks/use-toast";

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        // First, get the projects
        const projectsData = [
          {
            id: "sondre-justad",
            name: "Sondre Justad",
            lastInvoiced: "28.06.24",
            ownerId: "sondre-sandhaug",
            color: "bg-amber-700",
            gigPrice: "15 000 000kr",
            yearlyRevenue: "180 000 000kr"
          },
          {
            id: "briskeby",
            name: "Briskeby",
            lastInvoiced: "29.09.24",
            ownerId: "stian-sagholen",
            color: "bg-rose-800",
            gigPrice: "12 000 000kr",
            yearlyRevenue: "144 000 000kr"
          },
          {
            id: "highasakite",
            name: "Highasakite",
            lastInvoiced: "28.06.24",
            ownerId: "raymond-hellem",
            color: "bg-blue-700",
            gigPrice: "18 000 000kr",
            yearlyRevenue: "216 000 000kr"
          },
        ];

        // Then, fetch all owners from crew_members
        const { data: crewMembers, error } = await supabase
          .from('crew_members')
          .select('id, name')
          .eq('folder', 'Sonic City');

        if (error) throw error;

        // Map projects with actual owner names
        const projectsWithOwners = projectsData.map(project => {
          const owner = crewMembers?.find(crew => crew.name.toLowerCase().replace(' ', '-') === project.ownerId)?.name || 'Unknown Owner';
          return {
            ...project,
            owner
          };
        });

        setProjects(projectsWithOwners);
      } catch (error) {
        console.error('Error fetching projects:', error);
        toast({
          title: "Error",
          description: "Failed to fetch projects and owners",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [toast]);

  return { projects, loading };
}