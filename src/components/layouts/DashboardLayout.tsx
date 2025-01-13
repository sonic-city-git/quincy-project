import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactNode } from "react";

interface DashboardCardProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}

function DashboardCard({ title, icon, children }: DashboardCardProps) {
  return (
    <Card className="border-0 shadow-md bg-zinc-900/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="p-6 space-y-6">
      {children}
    </div>
  );
}

export { DashboardCard };