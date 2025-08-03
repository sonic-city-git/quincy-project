import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  Package, 
  AlertTriangle, 
  Settings, 
  Filter,
  TrendingUp,
  Clock,
  Building,
  Calendar,
  UserX
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCrew } from "@/hooks/useCrew";
import { useEquipment } from "@/hooks/useEquipment";
import { useCrewRoles } from "@/hooks/useCrewRoles";
import { useFolders } from "@/hooks/useFolders";

interface DashboardStatsCardsProps {
  selectedOwnerId?: string;
}

export function DashboardStatsCards({ selectedOwnerId }: DashboardStatsCardsProps) {
  // Data hooks
  const { crew, loading: crewLoading } = useCrew();
  const { equipment, loading: equipmentLoading } = useEquipment();
  const { roles } = useCrewRoles();
  const { folders } = useFolders();

  // Equipment conflicts query
  const { data: conflictStats, isLoading: conflictsLoading } = useQuery({
    queryKey: ['equipment-conflicts-stats', selectedOwnerId],
    queryFn: async () => {
      let query = supabase
        .from('project_event_equipment')
        .select(`
          equipment_id,
          quantity,
          equipment:equipment_id!inner (
            name,
            stock
          ),
          project_events!inner (
            date,
            project:projects!inner (
              owner_id
            )
          )
        `);

      if (selectedOwnerId) {
        query = query.eq('project_events.project.owner_id', selectedOwnerId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Process conflicts (simplified version)
      const equipmentUsage = new Map<string, { stock: number, totalUsed: number }>();
      
      data?.forEach(booking => {
        const equipmentId = booking.equipment_id;
        const stock = booking.equipment?.stock || 0;
        const used = booking.quantity || 0;
        
        if (!equipmentUsage.has(equipmentId)) {
          equipmentUsage.set(equipmentId, { stock, totalUsed: 0 });
        }
        
        const current = equipmentUsage.get(equipmentId)!;
        current.totalUsed += used;
      });

      const conflicts = Array.from(equipmentUsage.values()).filter(
        item => item.totalUsed > item.stock
      ).length;

      return { conflicts };
    }
  });

  // Unassigned roles query  
  const { data: unassignedStats, isLoading: unassignedLoading } = useQuery({
    queryKey: ['unassigned-roles-stats', selectedOwnerId],
    queryFn: async () => {
      let query = supabase
        .from('project_event_roles')
        .select(`
          id,
          event:event_id (
            project:project_id (
              owner_id
            )
          )
        `)
        .is('crew_member_id', null);

      if (selectedOwnerId) {
        query = query.eq('event.project.owner_id', selectedOwnerId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return { unassigned: data?.length || 0 };
    }
  });

  // Active crew assignments today
  const { data: activeCrewStats, isLoading: activeCrewLoading } = useQuery({
    queryKey: ['active-crew-stats', selectedOwnerId],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      let query = supabase
        .from('project_event_roles')
        .select(`
          id,
          event:event_id!inner (
            date,
            project:project_id (
              owner_id
            )
          )
        `)
        .not('crew_member_id', 'is', null)
        .eq('event.date', today);

      if (selectedOwnerId) {
        query = query.eq('event.project.owner_id', selectedOwnerId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return { activeCrew: data?.length || 0 };
    }
  });

  // Calculate stats
  const crewStats = {
    total: crew?.length || 0,
    withRoles: crew?.filter(member => member.roles && member.roles.length > 0).length || 0,
    totalRoles: roles?.length || 0
  };

  const equipmentStats = {
    total: equipment?.length || 0,
    inStock: equipment?.filter(item => item.stock > 0).length || 0,
    totalFolders: folders?.filter(folder => !folder.parent_id).length || 0
  };
  
  equipmentStats.utilization = equipmentStats.total > 0 ? Math.round((equipmentStats.inStock / equipmentStats.total) * 100) : 0;

  const statCards = [
    // Crew Statistics
    {
      title: "Total Crew",
      value: crewStats.total,
      subtitle: "Members",
      icon: Users,
      color: "text-blue-500",
      bgColor: "from-blue-50/10 to-blue-100/10",
      borderColor: "border-blue-200/20",
      loading: crewLoading
    },
    {
      title: "Crew with Roles",
      value: crewStats.withRoles,
      subtitle: crewStats.total > 0 ? `${Math.round((crewStats.withRoles / crewStats.total) * 100)}% assigned` : "0% assigned",
      icon: Filter,
      color: "text-orange-500",
      bgColor: "from-orange-50/10 to-orange-100/10",
      borderColor: "border-orange-200/20",
      loading: crewLoading
    },
    {
      title: "Active Crew Today",
      value: activeCrewStats?.activeCrew || 0,
      subtitle: "Assignments",
      icon: Clock,
      color: "text-green-500",
      bgColor: "from-green-50/10 to-green-100/10",
      borderColor: "border-green-200/20",
      loading: activeCrewLoading
    },
    
    // Equipment Statistics
    {
      title: "Total Equipment",
      value: equipmentStats.total,
      subtitle: "Items",
      icon: Package,
      color: "text-purple-500",
      bgColor: "from-purple-50/10 to-purple-100/10",
      borderColor: "border-purple-200/20",
      loading: equipmentLoading
    },
    {
      title: "In Stock",
      value: equipmentStats.inStock,
      subtitle: `${equipmentStats.utilization}% available`,
      icon: TrendingUp,
      color: "text-emerald-500",
      bgColor: "from-emerald-50/10 to-emerald-100/10",
      borderColor: "border-emerald-200/20",
      loading: equipmentLoading
    },
    {
      title: "Equipment Categories",
      value: equipmentStats.totalFolders,
      subtitle: "Categories",
      icon: Settings,
      color: "text-cyan-500",
      bgColor: "from-cyan-50/10 to-cyan-100/10",
      borderColor: "border-cyan-200/20",
      loading: equipmentLoading
    },
    
    // Issues & Alerts
    {
      title: "Equipment Conflicts",
      value: conflictStats?.conflicts || 0,
      subtitle: "Overbookings",
      icon: AlertTriangle,
      color: "text-red-500",
      bgColor: "from-red-50/10 to-red-100/10",
      borderColor: "border-red-200/20",
      loading: conflictsLoading
    },
    {
      title: "Unassigned Roles",
      value: unassignedStats?.unassigned || 0,
      subtitle: "Open positions",
      icon: UserX,
      color: "text-amber-500",
      bgColor: "from-amber-50/10 to-amber-100/10",
      borderColor: "border-amber-200/20",
      loading: unassignedLoading
    },
    {
      title: "Available Roles",
      value: crewStats.totalRoles,
      subtitle: "Role types",
      icon: Building,
      color: "text-indigo-500",
      bgColor: "from-indigo-50/10 to-indigo-100/10",
      borderColor: "border-indigo-200/20",
      loading: crewLoading
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {statCards.map((stat, index) => {
        const IconComponent = stat.icon;
        
        return (
          <Card key={index} className={`border-0 shadow-md bg-gradient-to-br ${stat.bgColor} border ${stat.borderColor}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-background/10`}>
                    <IconComponent className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-xs text-muted-foreground/80">{stat.subtitle}</p>
                  </div>
                </div>
                <div className="text-right">
                  {!stat.loading ? (
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  ) : (
                    <Skeleton className="h-8 w-12" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

