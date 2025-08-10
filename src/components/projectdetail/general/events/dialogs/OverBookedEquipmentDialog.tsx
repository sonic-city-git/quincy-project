/**
 * 🔴 OVERBOOKED EQUIPMENT DIALOG
 * 
 * Shows equipment conflicts for a specific event with resolution options.
 * Replaces the complex sync dialogs with operational intelligence.
 */

import React from 'react';
import { AlertTriangle, Package, Calendar, Users, ExternalLink } from 'lucide-react';
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
import { CalendarEvent } from '@/types/events';
import { ConflictAnalysis } from '@/types/stock';
import { useExternalProviders } from '@/hooks/equipment/useExternalProviders';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface OverBookedEquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CalendarEvent;
  conflicts: ConflictAnalysis[];
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

  // TODO: Future subrental orders system will replace this
  // const { mutate: markAsSubrental } = useSubrentalManagement();
  const { data: providers = [], isLoading: providersLoading } = useExternalProviders();
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [subrentalCost, setSubrentalCost] = useState<string>('');
  const [subrentalNotes, setSubrentalNotes] = useState<string>('');

  const handleMarkAsSubrental = (equipmentId: string) => {
    if (!selectedProvider) {
      // TODO: Add proper toast notification
      console.log('Please select a provider');
      return;
    }

    // TODO: Implement subrental order creation
    console.log('Mark as subrental:', {
      eventId: event.id,
      equipmentId,
      providerId: selectedProvider,
      cost: subrentalCost ? parseFloat(subrentalCost) : null,
      notes: subrentalNotes || null
    });
  };

  const handleViewPlanner = () => {
    // TODO: Navigate to planner view for this date
    console.log('Opening planner for date:', event.date);
    // This will open the equipment planner focused on the event date
  };

  if (!conflicts.length) return null;

  const dialogTitle = (
    <div className="flex items-center gap-2">
      <AlertTriangle className="h-5 w-5 text-red-500" />
      Equipment Overbooking Detected
    </div>
  );

  const dialogDescription = (
    <>
      The following equipment is overbooked for <strong>{event.name}</strong> on{' '}
      <strong>{formatDate(event.date instanceof Date ? event.date.toISOString() : event.date)}</strong>.
      Review conflicts and choose resolution options.
    </>
  );

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={dialogTitle}
      description={dialogDescription}
      size="xl"
      contentClassName="max-h-[80vh] overflow-y-auto"
    >

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
              Total shortage: {conflicts.reduce((sum, conflict) => sum + conflict.conflict.deficit, 0)} items
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
                      <Badge variant="outline">{conflict.stockBreakdown.effectiveStock}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{conflict.stockBreakdown.totalUsed}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="destructive">{conflict.conflict.deficit}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {conflict.conflict.affectedEvents?.map((event, index) => (
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
    </FormDialog>
  );
}
