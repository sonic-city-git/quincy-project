/**
 * 🎯 CREW ROLES DIALOG
 * 
 * Shows crew role assignments for an event
 * Allows users to view unassigned roles and sync crew
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, RefreshCw } from 'lucide-react';
import { CalendarEvent } from '@/types/events';
import { useUnifiedEventSync } from '@/hooks/useUnifiedEventSync';
import { cn } from '@/lib/utils';

interface CrewRolesDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  event: CalendarEvent;
  onSyncPreferredCrew?: () => void;
}

export function CrewRolesDialog({
  isOpen,
  onOpenChange,
  event,
  onSyncPreferredCrew
}: CrewRolesDialogProps) {
  const { data: syncData } = useUnifiedEventSync(event);
  const { hasProjectRoles, roles, synced: isSynced } = syncData.crew;

  if (!hasProjectRoles) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>No Crew Roles</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            This event type doesn't require crew, or no crew roles are configured for this project.
          </p>
        </DialogContent>
      </Dialog>
    );
  }

  const assignedCount = roles.filter(role => role.assigned).length;
  const unassignedRoles = roles.filter(role => !role.assigned);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Crew Roles
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div className="text-sm">
              <span className="font-medium">
                {assignedCount}/{roles.length} roles assigned
              </span>
            </div>
            
            {!isSynced && onSyncPreferredCrew && (
              <Button 
                size="sm"
                onClick={onSyncPreferredCrew}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Sync Preferred
              </Button>
            )}
          </div>

          {/* Status Badge */}
          <div className="text-center">
            {isSynced ? (
              <Badge variant="default" className="bg-green-500">
                All roles assigned
              </Badge>
            ) : (
              <Badge variant="secondary">
                {unassignedRoles.length} unassigned role{unassignedRoles.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {/* Roles List */}
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-2">
              {roles.map((role) => (
                <Card 
                  key={role.id} 
                  className={cn(
                    'p-3 border-l-4',
                    role.assigned ? 'border-l-green-500' : 'border-l-orange-500'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: role.color || '#64748b' }}
                      />
                      <span className="font-medium">{role.name}</span>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      {role.assigned ? (
                        <span className="text-green-600">Assigned</span>
                      ) : (
                        <span className="text-orange-600">Unassigned</span>
                      )}
                    </div>
                  </div>
                  
                  {role.assigned && (
                    <div className="mt-1 text-sm text-muted-foreground">
                      Assigned to crew member
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </ScrollArea>

          {/* Help Text */}
          {!isSynced && (
            <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">
              <p><strong>Sync Preferred:</strong> Automatically assign preferred crew members from your project template</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}