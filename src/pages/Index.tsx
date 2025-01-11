import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart } from "lucide-react";

const Index = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Revenue Section */}
      <Card className="border-0 shadow-md bg-zinc-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-6 w-6" />
            Revenue Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Revenue chart coming soon...
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Equipment Conflicts */}
        <Card className="border-0 shadow-md bg-zinc-900/50">
          <CardHeader>
            <CardTitle>Equipment Conflicts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-muted-foreground">
              <p>Coming soon:</p>
              <ul className="list-disc list-inside">
                <li>Hard conflicts (urgent)</li>
                <li>Potential conflicts (from pending events)</li>
                <li>Slack notifications for urgent conflicts</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Empty Crew Roles */}
        <Card className="border-0 shadow-md bg-zinc-900/50">
          <CardHeader>
            <CardTitle>Empty Crew Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-muted-foreground">
              <p>Coming soon:</p>
              <ul className="list-disc list-inside">
                <li>Unassigned project event roles</li>
                <li>Filter by role type</li>
                <li>Filter by project owner</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;