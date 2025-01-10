import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, Folder } from "lucide-react";
import { CrewRole } from "@/hooks/useCrewRoles";

interface CrewCardProps {
  name: string;
  email: string;
  phone: string;
  folderName?: string;
  roles?: CrewRole[];
}

export function CrewCard({ name, email, phone, folderName, roles = [] }: CrewCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span className="text-lg font-semibold">{name}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>{email || 'No email'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{phone || 'No phone'}</span>
            </div>
            {folderName && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Folder className="h-4 w-4" />
                <span>{folderName}</span>
              </div>
            )}
          </div>
          
          {roles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className="text-xs px-2 py-1 rounded text-white"
                  style={{ backgroundColor: role.color }}
                >
                  {role.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}