/**
 * 👥 CREW ASSIGNMENT DIALOG
 * 
 * Shows crew conflicts, unfilled roles, and assignment options for a specific event.
 * Provides operational intelligence for crew management.
 */

import React, { useState } from 'react';
import { Users, AlertTriangle, UserCheck, UserX, Calendar, ExternalLink } from 'lucide-react';
import { FormDialog } from '@/components/shared/dialogs/FormDialog';
import { useCrew } from '@/hooks/crew/useCrew';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

  // Get crew members for assignment
  const { crew, isLoading: crewLoading, error: crewError } = useCrew();
  const queryClient = useQueryClient();
  
  // Handle loading and error states
  if (crewLoading) {
    return (
      <FormDialog
        open={open}
        onOpenChange={onOpenChange}
        title="Loading..."
        description="Loading crew data..."
        size="full"
      >
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading crew assignment data...</p>
          </div>
        </div>
      </FormDialog>
    );
  }
  
  if (crewError) {
    return (
      <FormDialog
        open={open}
        onOpenChange={onOpenChange}
        title="Error Loading Crew Data"
        description="There was an error loading crew information"
        size="full"
      >
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="text-red-500 mb-4">⚠️</div>
            <p className="text-muted-foreground">Failed to load crew data. Please try again.</p>
            <Button onClick={() => onOpenChange(false)} className="mt-4">
              Close
            </Button>
          </div>
        </div>
      </FormDialog>
    );
  }

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

  const handleAssignCrew = async (roleId: string, crewMemberId: string | null) => {
    try {
      const { error } = await supabase
        .from('project_event_roles')
        .update({ 
          crew_member_id: crewMemberId,
          updated_at: new Date().toISOString()
        })
        .eq('id', roleId);

      if (error) throw error;

      // Invalidate relevant queries to refresh the UI
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['event-roles', event.id] }),
        queryClient.invalidateQueries({ queryKey: ['crew-assignments'] }),
        queryClient.invalidateQueries({ queryKey: ['crew-conflicts'] })
      ]);

      toast.success(crewMemberId ? 'Crew member assigned successfully' : 'Crew member unassigned');
    } catch (error) {
      console.error('Error assigning crew:', error);
      toast.error('Failed to assign crew member');
    }
  };

  const handleResolveConflict = async (crewMemberId: string) => {
    // For now, this unassigns the crew member from the current event
    // In the future, this could open a more sophisticated conflict resolution dialog
    try {
      const { error } = await supabase
        .from('project_event_roles')
        .update({ 
          crew_member_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('event_id', event.id)
        .eq('crew_member_id', crewMemberId);

      if (error) throw error;

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['event-roles', event.id] }),
        queryClient.invalidateQueries({ queryKey: ['crew-assignments'] }),
        queryClient.invalidateQueries({ queryKey: ['crew-conflicts'] })
      ]);

      toast.success('Crew member unassigned from this event');
    } catch (error) {
      console.error('Error resolving conflict:', error);
      toast.error('Failed to resolve conflict');
    }
  };

  const handleViewPlanner = () => {
    // Navigate to crew planner for this date
    const dateStr = new Date(event.date).toISOString().split('T')[0];
    window.open(`/planner?date=${dateStr}&type=crew`, '_blank');
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

  // Accessible title (string only for screen readers)
  const dialogTitle = `Crew Status: ${event.name}`;

  // Accessible description (string only for screen readers)
  const dialogDescription = `Crew assignments and conflicts for ${formatDate(event.date)}${getStatusSummary() ? `. Issues found: ${getStatusSummary()}` : ''}`;

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
                      <TableHead>Assign Crew</TableHead>
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
                          <Select onValueChange={(crewMemberId) => handleAssignCrew(role.id, crewMemberId)}>
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="Select crew member" />
                            </SelectTrigger>
                            <SelectContent>
                              {crew?.map((member) => (
                                <SelectItem key={member.id} value={member.id}>
                                  {member.name}
                                  {member.roles && member.roles.length > 0 && (
                                    <span className="text-muted-foreground ml-2">
                                      ({member.roles.join(', ')})
                                    </span>
                                  )}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
              {eventRoles && eventRoles.length > 0 ? (
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
                          <div className="flex items-center gap-2">
                            <Select 
                              value={role.crew_member_id || "unassigned"} 
                              onValueChange={(crewMemberId) => handleAssignCrew(role.id, crewMemberId === "unassigned" ? null : crewMemberId)}
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select crew member" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                {crew?.map((member) => (
                                  <SelectItem key={member.id} value={member.id}>
                                    {member.name}
                                    {member.roles && member.roles.length > 0 && (
                                      <span className="text-muted-foreground ml-2">
                                        ({member.roles.join(', ')})
                                      </span>
                                    )}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 text-blue-500" />
                  <h3 className="text-lg font-medium mb-2">No Crew Roles Defined</h3>
                  <p className="text-sm">This event doesn't have any crew roles configured.</p>
                  <p className="text-sm mt-1">Add roles to the project variant to manage crew assignments.</p>
                </div>
              )}
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
