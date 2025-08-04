import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, Folder } from "lucide-react";
import { CrewRole } from "@/hooks/useCrewRoles";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getRoleBadgeStyle } from "@/design-system";

interface CrewCardProps {
  name: string;
  email: string;
  phone: string;
  folderName?: string;
  roles?: CrewRole[];
  avatar_url?: string;
}

export function CrewCard({ name, email, phone, folderName, roles = [], avatar_url }: CrewCardProps) {
  // Get initials for avatar fallback
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Avatar>
              {avatar_url ? (
                <AvatarImage src={avatar_url} alt={name} />
              ) : (
                email && <AvatarImage src={`https://www.gravatar.com/avatar/${Buffer.from(email).toString('hex')}?d=404`} />
              )}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <span className="text-lg font-semibold">{name}</span>
          </div>
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
                  className="text-xs px-2 py-1 rounded"
                  style={getRoleBadgeStyle(role.name)}
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