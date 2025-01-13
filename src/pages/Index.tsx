import { DashboardLayout, DashboardCard } from "@/components/layouts/DashboardLayout";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { EquipmentConflicts } from "@/components/dashboard/EquipmentConflicts";
import { EmptyCrewRoles } from "@/components/dashboard/EmptyCrewRoles";

const Index = () => {
  return (
    <DashboardLayout>
      {/* Revenue Section */}
      <DashboardCard 
        title="Revenue Overview"
        icon={<RevenueChart.Icon className="h-6 w-6" />}
      >
        <RevenueChart />
      </DashboardCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Equipment Conflicts */}
        <DashboardCard 
          title="Equipment Conflicts"
          icon={<EquipmentConflicts.Icon className="h-6 w-6" />}
        >
          <EquipmentConflicts />
        </DashboardCard>

        {/* Empty Crew Roles */}
        <DashboardCard 
          title="Empty Crew Roles"
          icon={<EmptyCrewRoles.Icon className="h-6 w-6" />}
        >
          <EmptyCrewRoles />
        </DashboardCard>
      </div>
    </DashboardLayout>
  );
};

export default Index;