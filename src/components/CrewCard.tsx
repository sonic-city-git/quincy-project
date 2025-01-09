import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, UserRound } from "lucide-react";

interface CrewCardProps {
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
}

export function CrewCard({ name, email, phone, role, status }: CrewCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span className="text-lg font-semibold">{name}</span>
          <Badge variant="outline" className="text-blue-600">
            {status}
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">{role}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>{email || 'No email'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{phone || 'No phone'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <UserRound className="h-4 w-4" />
            <span>{role}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}