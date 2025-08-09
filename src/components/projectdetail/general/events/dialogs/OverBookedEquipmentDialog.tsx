/**
 * 🔴 OVERBOOKED EQUIPMENT DIALOG
 * 
 * Shows equipment conflicts for a specific event with resolution options.
 * Replaces the complex sync dialogs with operational intelligence.
 */

import React from 'react';
import { AlertTriangle, Package, Calendar, Users, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { CalendarEvent } from '@/types/events';

interface EquipmentConflict {
  equipmentId: string;
  equipmentName: string;
  date: string;
  totalStock: number;
  totalUsed: number;
  overbooked: number;
  conflictingEvents: Array<{
    eventName: string;
    projectName: string;
    quantity: number;
  }>;
}

interface OverBookedEquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CalendarEvent;
  conflicts: EquipmentConflict[];
}

export function OverBookedEquipmentDialog({
  open,
  onOpenChange,
  event,
  conflicts
}: OverBookedEquipmentDialogProps) {
  
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleMarkAsSubrental = (equipmentId: string) => {
    // TODO: Implement subrental marking
    console.log('Marking as subrental:', equipmentId);
    // This will:
    // 1. Create subrental record
    // 2. Update equipment status to "resolved with subrental"
    // 3. Change icon to blue
  };

  const handleViewPlanner = () => {
    // TODO: Navigate to planner view for this date
    console.log('Opening planner for date:', event.date);
    // This will open the equipment planner focused on the event date
  };

  if (!conflicts.length) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Equipment Overbooking Detected
          </DialogTitle>
          <DialogDescription>
            The following equipment is overbooked for <strong>{event.name}</strong> on{' '}
            <strong>{formatDate(event.date instanceof Date ? event.date.toISOString() : event.date)}</strong>.
            Review conflicts and choose resolution options.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Conflict Summary */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-red-600" />
              <span className="font-medium text-red-800">
                {conflicts.length} equipment item{conflicts.length > 1 ? 's' : ''} overbooked
              </span>
            </div>
            <div className="text-sm text-red-700">
              Total shortage: {conflicts.reduce((sum, conflict) => sum + conflict.overbooked, 0)} items
            </div>
          </div>

          {/* Conflicts Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipment</TableHead>
                  <TableHead className="text-center">Stock</TableHead>
                  <TableHead className="text-center">Used</TableHead>
                  <TableHead className="text-center">Overbooked</TableHead>
                  <TableHead>Conflicting Events</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conflicts.map((conflict) => (
                  <TableRow key={conflict.equipmentId}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        {conflict.equipmentName}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{conflict.totalStock}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{conflict.totalUsed}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="destructive">{conflict.overbooked}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {conflict.conflictingEvents.map((event, index) => (
                          <div key={index} className="text-sm">
                            <div className="font-medium">{event.eventName}</div>
                            <div className="text-muted-foreground">
                              {event.projectName} • {event.quantity} units
                            </div>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkAsSubrental(conflict.equipmentId)}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          Mark as Subrental
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Resolution Options */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-3">Resolution Options</h4>
            <div className="space-y-2 text-sm text-blue-700">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <strong>Mark as Subrental:</strong> Resolve conflicts by renting additional equipment
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <strong>Reschedule Events:</strong> Move conflicting events to different dates
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <strong>Reduce Quantities:</strong> Use fewer equipment items per event
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleViewPlanner}
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              View in Planner
              <ExternalLink className="h-3 w-3" />
            </Button>
            
            <Button onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
