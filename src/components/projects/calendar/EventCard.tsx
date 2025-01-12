import { CalendarEvent } from "@/types/events";
import { Card } from "@/components/ui/card";
import { Calendar, Edit, MapPin, Package, Users, AlertTriangle, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getStatusIcon } from "@/utils/eventFormatters";
import { EVENT_COLORS } from "@/constants/eventColors";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface EquipmentItem {
  id: string;
  quantity: number;
  equipment: {
    name: string;
    code: string | null;
  };
  group: {
    name: string;
  } | null;
}

interface EquipmentDifference {
  added: EquipmentItem[];    // Completely new items
  removed: EquipmentItem[];  // Items that no longer exist
  changed: {                 // Items with quantity changes
    item: EquipmentItem;
    oldQuantity: number;
    newQuantity: number;
  }[];
}

interface EventCardProps {
  event: CalendarEvent;
  onStatusChange: (event: CalendarEvent, newStatus: CalendarEvent['status']) => void;
  onEdit?: (event: CalendarEvent) => void;
}

export function EventCard({ event, onStatusChange, onEdit }: EventCardProps) {
  const [isSynced, setIsSynced] = useState(true);
  const [hasEventEquipment, setHasEventEquipment] = useState(false);
  const [hasProjectEquipment, setHasProjectEquipment] = useState(false);
  const [isEquipmentDialogOpen, setIsEquipmentDialogOpen] = useState(false);
  const [equipmentDifference, setEquipmentDifference] = useState<EquipmentDifference>({
    added: [],
    removed: [],
    changed: []
  });

  const getEquipmentIcon = () => {
    if (!hasEventEquipment) {
      return <Package className="h-6 w-6 text-yellow-500" />;
    }
    if (!isSynced) {
      if (equipmentDifference.changed.length > 0) {
        return <RefreshCw className="h-6 w-6 text-blue-500" />;
      }
      return <AlertTriangle className="h-6 w-6 text-orange-500" />;
    }
    return <Package className="h-6 w-6 text-green-500" />;
  };

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const { data: projectEquipment } = await supabase
          .from('project_equipment')
          .select('id')
          .eq('project_id', event.project_id)
          .limit(1);
        
        setHasProjectEquipment(!!projectEquipment?.length);

        const { data: eventEquipment, error } = await supabase
          .from('project_event_equipment')
          .select('*')
          .eq('event_id', event.id);

        if (!error) {
          const hasEquipment = eventEquipment && eventEquipment.length > 0;
          setHasEventEquipment(hasEquipment);
          setIsSynced(hasEquipment ? eventEquipment.every(item => item.is_synced) : true);
        } else {
          console.error('Error fetching equipment status:', error);
          setHasEventEquipment(false);
          setIsSynced(true);
        }
      } catch (error) {
        console.error('Error in fetchStatus:', error);
        setHasEventEquipment(false);
        setIsSynced(true);
      }
    };

    if (event.type.needs_equipment) {
      fetchStatus();
    }
  }, [event.id, event.project_id, event.type.needs_equipment]);

  const handleEquipmentOption = async () => {
    try {
      const { data: projectEquipment, error: fetchError } = await supabase
        .from('project_equipment')
        .select('*')
        .eq('project_id', event.project_id);

      if (fetchError) throw fetchError;

      const { error: deleteError } = await supabase
        .from('project_event_equipment')
        .delete()
        .eq('event_id', event.id);

      if (deleteError) throw deleteError;

      if (projectEquipment && projectEquipment.length > 0) {
        const eventEquipment = projectEquipment.map(item => ({
          project_id: event.project_id,
          event_id: event.id,
          equipment_id: item.equipment_id,
          quantity: item.quantity,
          group_id: item.group_id,
          is_synced: true
        }));

        const { error: upsertError } = await supabase
          .from('project_event_equipment')
          .upsert(eventEquipment, {
            onConflict: 'event_id,equipment_id',
            ignoreDuplicates: true
          });

        if (upsertError) throw upsertError;
      }

      setIsSynced(true);
      setHasEventEquipment(true);
      toast.success('Equipment list synchronized successfully');
    } catch (error) {
      console.error('Error syncing equipment:', error);
      toast.error('Failed to sync equipment list');
    }
  };

  const viewOutOfSyncEquipment = async () => {
    try {
      console.log('Fetching equipment differences...');
      
      const { data: projectEquipment, error: projectError } = await supabase
        .from('project_equipment')
        .select(`
          id,
          quantity,
          equipment:equipment_id (
            name,
            code
          ),
          group:group_id (
            name
          )
        `)
        .eq('project_id', event.project_id);

      if (projectError) throw projectError;

      const { data: eventEquipment, error: eventError } = await supabase
        .from('project_event_equipment')
        .select(`
          id,
          quantity,
          equipment:equipment_id (
            name,
            code
          ),
          group:group_id (
            name
          )
        `)
        .eq('event_id', event.id);

      if (eventError) throw eventError;

      console.log('Project equipment:', projectEquipment);
      console.log('Event equipment:', eventEquipment);

      const added: EquipmentItem[] = [];
      const removed: EquipmentItem[] = [];
      const changed: EquipmentDifference['changed'] = [];

      // Create maps with equipment name as key and full item as value
      const projectMap = new Map(projectEquipment?.map(item => [item.equipment.name, item]) || []);
      const eventMap = new Map(eventEquipment?.map(item => [item.equipment.name, item]) || []);

      // Check project equipment against event equipment
      projectEquipment?.forEach(projectItem => {
        const eventItem = eventMap.get(projectItem.equipment.name);
        
        if (!eventItem) {
          // Item is completely new
          console.log('Added new:', projectItem.equipment.name, {
            quantity: projectItem.quantity
          });
          added.push(projectItem as EquipmentItem);
        } else if (eventItem.quantity !== projectItem.quantity) {
          // Item exists but quantity changed
          console.log('Changed:', projectItem.equipment.name, {
            oldQty: eventItem.quantity,
            newQty: projectItem.quantity
          });
          changed.push({
            item: projectItem as EquipmentItem,
            oldQuantity: eventItem.quantity,
            newQuantity: projectItem.quantity
          });
        }
      });

      // Check event equipment against project equipment
      eventEquipment?.forEach(eventItem => {
        const projectItem = projectMap.get(eventItem.equipment.name);
        
        if (!projectItem) {
          // Item was completely removed
          console.log('Removed:', eventItem.equipment.name, {
            quantity: eventItem.quantity
          });
          removed.push(eventItem as EquipmentItem);
        }
      });

      console.log('Differences found:', { added, removed, changed });

      setEquipmentDifference({ added, removed, changed });
      setIsEquipmentDialogOpen(true);

      if (added.length === 0 && removed.length === 0 && changed.length === 0) {
        toast.info('No differences found in equipment lists');
      }
    } catch (error) {
      console.error('Error fetching equipment differences:', error);
      toast.error('Failed to fetch equipment differences');
    }
  };

  const renderEquipmentList = (items: EquipmentItem[], type: 'added' | 'removed') => {
    const groupedEquipment = items.reduce((acc, item) => {
      const groupName = item.group?.name || 'Ungrouped';
      if (!acc[groupName]) {
        acc[groupName] = [];
      }
      acc[groupName].push(item);
      return acc;
    }, {} as Record<string, EquipmentItem[]>);

    return Object.entries(groupedEquipment).map(([groupName, items]) => (
      <div key={groupName} className="mb-4">
        <h3 className="text-sm font-medium mb-2 px-2 py-1 bg-secondary/10 rounded-md">
          {groupName}
        </h3>
        <div className="space-y-2">
          {items.map((item) => (
            <Card key={item.id} className={`p-2 ${type === 'added' ? 'border-green-500' : 'border-red-500'}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm">
                  {item.equipment.name}
                  {item.equipment.code && (
                    <span className="text-muted-foreground ml-1">
                      ({item.equipment.code})
                    </span>
                  )}
                </span>
                <span className="text-sm text-muted-foreground">
                  Qty: {item.quantity}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    ));
  };

  const renderChangedEquipmentList = (items: EquipmentDifference['changed']) => {
    const groupedEquipment = items.reduce((acc, { item }) => {
      const groupName = item.group?.name || 'Ungrouped';
      if (!acc[groupName]) {
        acc[groupName] = [];
      }
      acc[groupName].push(item);
      return acc;
    }, {} as Record<string, EquipmentItem[]>);

    return Object.entries(groupedEquipment).map(([groupName, groupItems]) => (
      <div key={groupName} className="mb-4">
        <h3 className="text-sm font-medium mb-2 px-2 py-1 bg-secondary/10 rounded-md">
          {groupName}
        </h3>
        <div className="space-y-2">
          {items
            .filter(({ item }) => (item.group?.name || 'Ungrouped') === groupName)
            .map(({ item, oldQuantity, newQuantity }) => (
              <Card key={item.id} className="p-2 border-blue-500">
                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    {item.equipment.name}
                    {item.equipment.code && (
                      <span className="text-muted-foreground ml-1">
                        ({item.equipment.code})
                      </span>
                    )}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Qty: {oldQuantity} → {newQuantity}
                  </span>
                </div>
              </Card>
            ))}
        </div>
      </div>
    ));
  };

  return (
    <>
      <Card key={`${event.date}-${event.name}`} className="p-4">
        <div className="grid grid-cols-[120px_1fr_40px_40px_1fr_auto] gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {format(event.date, 'dd.MM.yy')}
            </span>
          </div>
          
          <div className="flex flex-col">
            <div className="flex items-start">
              <span className="font-medium text-base">
                {event.name}
              </span>
            </div>
            {event.location && (
              <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{event.location}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center">
            {event.type.needs_equipment && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      {hasEventEquipment && isSynced ? (
                        <Package className="h-6 w-6 text-green-500" />
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 p-0"
                            >
                              {getEquipmentIcon()}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            {!hasEventEquipment ? (
                              <DropdownMenuItem onClick={handleEquipmentOption}>
                                Sync from project equipment
                              </DropdownMenuItem>
                            ) : !isSynced ? (
                              <>
                                <DropdownMenuItem onClick={viewOutOfSyncEquipment}>
                                  View equipment list
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleEquipmentOption}>
                                  Sync from project equipment
                                </DropdownMenuItem>
                              </>
                            ) : null}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {hasEventEquipment && isSynced 
                      ? "Equipment list is NSYNC" 
                      : !hasEventEquipment 
                        ? "No equipment assigned"
                        : "Equipment list out of sync"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          <div className="flex items-center justify-center">
            {event.type.needs_crew && (
              <Users className="h-6 w-6 text-muted-foreground" />
            )}
          </div>

          <div className="flex items-center">
            <span 
              className={`text-sm px-2 py-1 rounded-md ${EVENT_COLORS[event.type.name]}`}
            >
              {event.type.name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="flex items-center gap-2"
                >
                  {getStatusIcon(event.status)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={() => onStatusChange(event, 'proposed')}
                  className="flex items-center gap-2"
                >
                  {getStatusIcon('proposed')}
                  Proposed
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onStatusChange(event, 'confirmed')}
                  className="flex items-center gap-2"
                >
                  {getStatusIcon('confirmed')}
                  Confirmed
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onStatusChange(event, 'invoice ready')}
                  className="flex items-center gap-2"
                >
                  {getStatusIcon('invoice ready')}
                  Invoice Ready
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onStatusChange(event, 'cancelled')}
                  className="flex items-center gap-2"
                >
                  {getStatusIcon('cancelled')}
                  Cancelled
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(event)}
                className="text-muted-foreground hover:text-foreground"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Dialog open={isEquipmentDialogOpen} onOpenChange={setIsEquipmentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Equipment List Differences</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-6 p-4">
              {equipmentDifference.added.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-green-500 mb-4">Added Equipment</h2>
                  {renderEquipmentList(equipmentDifference.added, 'added')}
                </div>
              )}
              {equipmentDifference.changed.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-blue-500 mb-4">Changed Quantities</h2>
                  {renderChangedEquipmentList(equipmentDifference.changed)}
                </div>
              )}
              {equipmentDifference.removed.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-red-500 mb-4">Removed Equipment</h2>
                  {renderEquipmentList(equipmentDifference.removed, 'removed')}
                </div>
              )}
              {equipmentDifference.added.length === 0 && 
               equipmentDifference.removed.length === 0 && 
               equipmentDifference.changed.length === 0 && (
                <p className="text-center text-muted-foreground">No differences found in equipment lists</p>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
