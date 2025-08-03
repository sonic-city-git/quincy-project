import { useState, useEffect } from "react";
import { Database, Package, Users, Filter, AlertTriangle, Settings } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Import the custom header and table components
import { ResourcesHeader, ResourceFilters } from "@/components/resources/ResourcesHeader";
import { ResourceCrewTable } from "@/components/resources/tables/ResourceCrewTable";
import { ResourceEquipmentTable } from "@/components/resources/tables/ResourceEquipmentTable";
import { AddMemberDialog } from "@/components/crew/AddMemberDialog";
import { AddEquipmentDialog } from "@/components/equipment/AddEquipmentDialog";
import { SyncAvatarsButton } from "@/components/crew/SyncAvatarsButton";

// Import hooks for stats
import { useCrew } from "@/hooks/useCrew";
import { useEquipment } from "@/hooks/useEquipment";
import { useCrewRoles } from "@/hooks/useCrewRoles";
import { useFolders } from "@/hooks/useFolders";

const Resources = () => {
  // Initialize activeTab from localStorage, fallback to 'equipment'
  const [activeTab, setActiveTab] = useState<'equipment' | 'crew'>(() => {
    try {
      const savedTab = localStorage.getItem('resources-active-tab');
      return (savedTab === 'crew' || savedTab === 'equipment') ? savedTab : 'equipment';
    } catch {
      return 'equipment';
    }
  });

  // Filter state
  const [filters, setFilters] = useState<ResourceFilters>({
    search: '',
    equipmentType: '',
    crewRole: ''
  });

  // Persist activeTab to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('resources-active-tab', activeTab);
    } catch (error) {
      console.warn('Could not save preferences to localStorage:', error);
    }
  }, [activeTab]);

  // Data hooks for stats
  const { crew, loading: crewLoading } = useCrew();
  const { equipment, loading: equipmentLoading } = useEquipment();
  const { roles } = useCrewRoles();
  const { folders } = useFolders();

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

  return (
    <div className="container max-w-[1600px] p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Database className="h-8 w-8 text-purple-500" />
        <div>
          <h1 className="text-3xl font-bold">Resources</h1>
          <p className="text-muted-foreground">
            Manage your crew members and equipment inventory across all projects
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-4">
        {/* Resources Header with Tab Switching and Filters */}
        <ResourcesHeader
          activeTab={activeTab}
          onTabChange={setActiveTab}
          filters={filters}
          onFiltersChange={setFilters}
        />
        
        {/* Table Content - Structured like planner timeline */}
        <div className="space-y-4">
          {activeTab === 'crew' ? (
            <ResourceCrewTable filters={filters} />
          ) : (
            <ResourceEquipmentTable filters={filters} />
          )}
        </div>
      </div>

      {/* Tab-Specific Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        {activeTab === 'crew' ? (
          <>
            <Card className="border-orange-200/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-orange-600" />
                    <div>
                      <p className="text-sm font-medium">Total Crew</p>
                      <p className="text-xs text-muted-foreground">Active members</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {!crewLoading ? (
                      <>
                        <p className="text-lg font-bold text-orange-600">{crewStats.total}</p>
                        <p className="text-xs text-muted-foreground">Members</p>
                      </>
                    ) : (
                      <Skeleton className="h-8 w-12" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-orange-200/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-orange-600" />
                    <div>
                      <p className="text-sm font-medium">Crew with Roles</p>
                      <p className="text-xs text-muted-foreground">Assigned roles</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {!crewLoading ? (
                      <>
                        <p className="text-lg font-bold text-orange-600">{crewStats.withRoles}</p>
                        <p className="text-xs text-muted-foreground">
                          {crewStats.total > 0 ? Math.round((crewStats.withRoles / crewStats.total) * 100) : 0}% assigned
                        </p>
                      </>
                    ) : (
                      <Skeleton className="h-8 w-12" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-orange-200/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-orange-600" />
                    <div>
                      <p className="text-sm font-medium">Available Roles</p>
                      <p className="text-xs text-muted-foreground">Total roles</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-orange-600">{crewStats.totalRoles}</p>
                    <p className="text-xs text-muted-foreground">Role types</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card className="border-green-200/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">Total Equipment</p>
                      <p className="text-xs text-muted-foreground">All items</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {!equipmentLoading ? (
                      <>
                        <p className="text-lg font-bold text-green-600">{equipmentStats.total}</p>
                        <p className="text-xs text-muted-foreground">Items</p>
                      </>
                    ) : (
                      <Skeleton className="h-8 w-12" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-green-200/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">In Stock</p>
                      <p className="text-xs text-muted-foreground">Available items</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {!equipmentLoading ? (
                      <>
                        <p className="text-lg font-bold text-green-600">{equipmentStats.inStock}</p>
                        <p className="text-xs text-muted-foreground">
                          {equipmentStats.total > 0 ? Math.round((equipmentStats.inStock / equipmentStats.total) * 100) : 0}% available
                        </p>
                      </>
                    ) : (
                      <Skeleton className="h-8 w-12" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-green-200/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">Equipment Categories</p>
                      <p className="text-xs text-muted-foreground">Main folders</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">{equipmentStats.totalFolders}</p>
                    <p className="text-xs text-muted-foreground">Categories</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Add Dialogs */}
      <AddMemberDialog />
      <AddEquipmentDialog />
    </div>
  );
};

export default Resources;