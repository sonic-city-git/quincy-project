import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, Folder } from "lucide-react";

interface CrewCardProps {
  name: string;
  email: string;
  phone: string;
  folderName?: string;
}

export function CrewCard({ name, email, phone, folderName }: CrewCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span className="text-lg font-semibold">{name}</span>
        </CardTitle>
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
          {folderName && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Folder className="h-4 w-4" />
              <span>{folderName}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}