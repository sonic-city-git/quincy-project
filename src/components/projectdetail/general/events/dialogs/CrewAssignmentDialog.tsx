/**
 * 👥 CREW ASSIGNMENT DIALOG
 * 
 * Shows crew conflicts, unfilled roles, and assignment options for a specific event.
 * Provides operational intelligence for crew management.
 */

import React, { useState } from 'react';
import { Users, AlertTriangle, UserCheck, UserX, Calendar, ExternalLink } from 'lucide-react';
import { FormDialog } from '@/components/shared/dialogs/FormDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarEvent } from '@/types/events';

interface CrewConflict {
  crewMemberId: string;
  crewMemberName: string;
  date: string;
  conflictingAssignments: Array<{
    eventName: string;
    projectName: string;
    role?: string;
  }>;
}

interface EventRole {
  id: string;
  crew_member_id: string | null;
  role_id: string;
  crew_members?: { id: string; name: string } | null;
  crew_roles?: { id: string; name: string } | null;
  project_roles?: { id: string; preferred_id: string | null } | null;
}

interface CrewAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CalendarEvent;
  conflicts: CrewConflict[];
  eventRoles: EventRole[];
  unfilledCount: number;
  nonPreferredCount: number;
  nonPreferredRoles?: EventRole[];
}

export function CrewAssignmentDialog({
  open,
  onOpenChange,
  event,
  conflicts,
  eventRoles,
  unfilledCount,
  nonPreferredCount,
  nonPreferredRoles = []
}: CrewAssignmentDialogProps) {
  
  const [activeTab, setActiveTab] = useState<string>(() => {
    // Auto-select the most critical tab
    if (conflicts.length > 0) return 'conflicts';
    if (unfilledCount > 0) return 'unfilled';
    if (nonPreferredCount > 0) return 'assignments';
    return 'assignments';
  });

  const formatDate = (dateStr: string | Date) => {
    const date = dateStr instanceof Date ? dateStr : new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Categorize roles
  const unfilledRoles = eventRoles.filter(role => !role.crew_member_id);
  const nonPreferredAssignments = eventRoles.filter(role => 
    role.crew_member_id && 
    role.project_roles?.preferred_id && 
    role.crew_member_id !== role.project_roles.preferred_id
  );
  const filledRoles = eventRoles.filter(role => role.crew_member_id);

  const handleAssignCrew = (roleId: string) => {
    // TODO: Open crew selection interface
    console.log('Opening crew assignment for role:', roleId);
  };

  const handleResolveConflict = (crewMemberId: string) => {
    // TODO: Open conflict resolution interface
    console.log('Resolving conflict for crew member:', crewMemberId);
  };

  const handleViewPlanner = () => {
    // TODO: Navigate to crew planner for this date
    console.log('Opening crew planner for date:', event.date);
  };

  const getStatusSummary = () => {
    const issues = [];
    if (conflicts.length > 0) issues.push(`${conflicts.length} conflict${conflicts.length > 1 ? 's' : ''}`);
    if (unfilledCount > 0) issues.push(`${unfilledCount} unfilled role${unfilledCount > 1 ? 's' : ''}`);
    if (nonPreferredCount > 0) issues.push(`${nonPreferredCount} non-preferred assignment${nonPreferredCount > 1 ? 's' : ''}`);
    return issues.join(', ');
  };

  const getStatusColor = () => {
    if (conflicts.length > 0 || unfilledCount > 0) return 'red';
    if (nonPreferredCount > 0) return 'blue';
    return 'green';
  };

  const statusColor = getStatusColor();

  const dialogTitle = (
    <div className="flex items-center gap-2">
      <Users className={`h-5 w-5 ${
        statusColor === 'red' ? 'text-red-500' : 
        statusColor === 'blue' ? 'text-blue-500' : 'text-green-500'
      }`} />
      Crew Status: {event.name}
    </div>
  );

  const dialogDescription = (
    <>
      Crew assignments and conflicts for{' '}
      <strong>{formatDate(event.date)}</strong>
      {getStatusSummary() && (
        <span className="block mt-1 font-medium text-foreground">
          Issues found: {getStatusSummary()}
        </span>
      )}
    </>
  );

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={dialogTitle}
      description={dialogDescription}
      size="full"
      contentClassName="max-h-[80vh] overflow-y-auto"
    >

        <div className="space-y-6">
          {/* Status Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg border-2 ${
              conflicts.length > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className={`h-4 w-4 ${conflicts.length > 0 ? 'text-red-600' : 'text-gray-400'}`} />
                <span className="font-medium">Conflicts</span>
              </div>
              <div className="text-2xl font-bold">{conflicts.length}</div>
            </div>

            <div className={`p-4 rounded-lg border-2 ${
              unfilledCount > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <UserX className={`h-4 w-4 ${unfilledCount > 0 ? 'text-red-600' : 'text-gray-400'}`} />
                <span className="font-medium">Unfilled</span>
              </div>
              <div className="text-2xl font-bold">{unfilledCount}</div>
            </div>

            <div className={`p-4 rounded-lg border-2 ${
              nonPreferredCount > 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <UserCheck className={`h-4 w-4 ${nonPreferredCount > 0 ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className="font-medium">Non-Preferred</span>
              </div>
              <div className="text-2xl font-bold">{nonPreferredCount}</div>
            </div>
          </div>

          {/* Tabbed Interface */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="conflicts" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Conflicts ({conflicts.length})
              </TabsTrigger>
              <TabsTrigger value="unfilled" className="flex items-center gap-2">
                <UserX className="h-4 w-4" />
                Unfilled ({unfilledCount})
              </TabsTrigger>
              <TabsTrigger value="assignments" className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                All Assignments ({eventRoles.length})
              </TabsTrigger>
            </TabsList>

            {/* Conflicts Tab */}
            <TabsContent value="conflicts" className="space-y-4">
              {conflicts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Crew Member</TableHead>
                      <TableHead>Conflicting Events</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {conflicts.map((conflict) => (
                      <TableRow key={conflict.crewMemberId}>
                        <TableCell className="font-medium">
                          {conflict.crewMemberName}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {conflict.conflictingAssignments.map((assignment, index) => (
                              <div key={index} className="text-sm">
                                <div className="font-medium">{assignment.eventName}</div>
                                <div className="text-muted-foreground">
                                  {assignment.projectName}
                                  {assignment.role && ` • ${assignment.role}`}
                                </div>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResolveConflict(conflict.crewMemberId)}
                          >
                            Resolve Conflict
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <UserCheck className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>No crew conflicts detected for this event.</p>
                </div>
              )}
            </TabsContent>

            {/* Unfilled Roles Tab */}
            <TabsContent value="unfilled" className="space-y-4">
              {unfilledRoles.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unfilledRoles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium">
                          {role.crew_roles?.name || 'Unknown Role'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive">Unfilled</Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => handleAssignCrew(role.id)}
                          >
                            Assign Crew
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <UserCheck className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>All roles are filled for this event.</p>
                </div>
              )}
            </TabsContent>

            {/* All Assignments Tab */}
            <TabsContent value="assignments" className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Assigned Crew</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eventRoles.map((role) => {
                    const isUnfilled = !role.crew_member_id;
                    const isNonPreferred = role.crew_member_id && 
                      role.project_roles?.preferred_id && 
                      role.crew_member_id !== role.project_roles.preferred_id;
                    
                    return (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium">
                          {role.crew_roles?.name || 'Unknown Role'}
                        </TableCell>
                        <TableCell>
                          {role.crew_members?.name || (
                            <span className="text-muted-foreground italic">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {isUnfilled ? (
                            <Badge variant="destructive">Unfilled</Badge>
                          ) : isNonPreferred ? (
                            <Badge variant="secondary">Non-Preferred</Badge>
                          ) : (
                            <Badge variant="default">Assigned</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAssignCrew(role.id)}
                          >
                            {isUnfilled ? 'Assign' : 'Change'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleViewPlanner}
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              View in Crew Planner
              <ExternalLink className="h-3 w-3" />
            </Button>
            
            <Button onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
    </FormDialog>
  );
}
