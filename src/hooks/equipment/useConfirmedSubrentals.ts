/**
 * 🎯 CONFIRMED SUBRENTALS HOOK
 * 
 * Manages confirmed subrental data for the timeline.
 * Shows actual booked subrentals vs. suggested ones.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ConfirmedSubrental } from '@/types/equipment';

interface UseConfirmedSubrentalsProps {
  visibleTimelineStart?: Date;
  visibleTimelineEnd?: Date;
  enabled?: boolean;
}

interface ConfirmedSubrentalPeriod {
  id: string;
  equipment_id: string;
  equipment_name: string;
  provider_name: string;
  start_date: string;
  end_date: string;
  quantity: number;
  cost: number | null;
  temporary_serial?: string;
  status: string;
}

export function useConfirmedSubrentals({
  visibleTimelineStart,
  visibleTimelineEnd,
  enabled = true
}: UseConfirmedSubrentalsProps = {}) {

  // Fetch confirmed subrentals from database
  const { data: confirmedSubrentals = [], isLoading } = useQuery({
    queryKey: ['confirmed-subrentals', visibleTimelineStart?.toISOString(), visibleTimelineEnd?.toISOString()],
    queryFn: async (): Promise<ConfirmedSubrental[]> => {
      let query = supabase
        .from('confirmed_subrentals')
        .select(`
          *,
          external_providers!inner(company_name)
        `)
        .in('status', ['confirmed', 'delivered']); // Only active subrentals

      // Filter by date range if provided
      if (visibleTimelineStart && visibleTimelineEnd) {
        query = query
          .gte('start_date', visibleTimelineStart.toISOString().split('T')[0])
          .lte('end_date', visibleTimelineEnd.toISOString().split('T')[0]);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching confirmed subrentals:', error);
        throw error;
      }

      return data || [];
    },
    enabled: enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });

  // Process confirmed subrentals into periods for timeline display
  const confirmedPeriods: ConfirmedSubrentalPeriod[] = confirmedSubrentals.map(subrental => ({
    id: subrental.id,
    equipment_id: subrental.equipment_id,
    equipment_name: subrental.equipment_name,
    provider_name: (subrental as any).external_providers?.company_name || 'Unknown Provider',
    start_date: subrental.start_date,
    end_date: subrental.end_date,
    quantity: subrental.quantity,
    cost: subrental.cost,
    temporary_serial: subrental.temporary_serial,
    status: subrental.status
  }));

  // Group periods by date for timeline rendering
  const periodsByDate = new Map<string, ConfirmedSubrentalPeriod[]>();
  
  confirmedPeriods.forEach(period => {
    const startDate = new Date(period.start_date);
    const endDate = new Date(period.end_date);
    
    // Add to each date in the period range
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      
      if (!periodsByDate.has(dateStr)) {
        periodsByDate.set(dateStr, []);
      }
      periodsByDate.get(dateStr)!.push(period);
    }
  });

  // Determine if we should show the confirmed subrental section
  const shouldShowConfirmedSection = confirmedPeriods.length > 0;

  return {
    confirmedSubrentals,
    confirmedPeriods,
    periodsByDate,
    shouldShowConfirmedSection,
    isLoading
  };
}
