import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SchedulingTimeline } from "./SchedulingTimeline";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function SchedulingSidebar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredItems, setFilteredItems] = useState<any[]>([]);

  // Fetch equipment bookings
  const { data: equipmentBookings = [] } = useQuery({
    queryKey: ['equipment-bookings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_event_equipment')
        .select(`
          id,
          equipment_id,
          equipment:equipment (
            id,
            name
          ),
          event:project_events (
            id,
            name,
            date,
            status
          )
        `)
        .order('created_at');

      if (error) throw error;
      return data;
    }
  });

  // Fetch crew bookings
  const { data: crewBookings = [] } = useQuery({
    queryKey: ['crew-bookings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_event_roles')
        .select(`
          id,
          crew_member_id,
          crew_member:crew_members (
            id,
            name
          ),
          event:project_events (
            id,
            name,
            date,
            status
          )
        `)
        .order('created_at');

      if (error) throw error;
      return data;
    }
  });

  // Process bookings into timeline items
  useEffect(() => {
    const equipmentItems = equipmentBookings.reduce((acc: any[], booking: any) => {
      if (!booking.equipment) return acc;
      
      const existingItem = acc.find(item => item.id === booking.equipment.id);
      const bookingData = {
        id: booking.id,
        eventId: booking.event.id,
        eventName: booking.event.name,
        date: new Date(booking.event.date),
        status: booking.event.status
      };

      if (existingItem) {
        existingItem.bookings.push(bookingData);
      } else {
        acc.push({
          id: booking.equipment.id,
          name: booking.equipment.name,
          type: 'equipment',
          bookings: [bookingData]
        });
      }
      return acc;
    }, []);

    const crewItems = crewBookings.reduce((acc: any[], booking: any) => {
      if (!booking.crew_member) return acc;
      
      const existingItem = acc.find(item => item.id === booking.crew_member.id);
      const bookingData = {
        id: booking.id,
        eventId: booking.event.id,
        eventName: booking.event.name,
        date: new Date(booking.event.date),
        status: booking.event.status
      };

      if (existingItem) {
        existingItem.bookings.push(bookingData);
      } else {
        acc.push({
          id: booking.crew_member.id,
          name: booking.crew_member.name,
          type: 'crew',
          bookings: [bookingData]
        });
      }
      return acc;
    }, []);

    const allItems = [...equipmentItems, ...crewItems]
      .filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name));

    setFilteredItems(allItems);
  }, [equipmentBookings, crewBookings, searchTerm]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b border-zinc-800">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search resources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <SchedulingTimeline items={filteredItems} />
      </div>
    </div>
  );
}