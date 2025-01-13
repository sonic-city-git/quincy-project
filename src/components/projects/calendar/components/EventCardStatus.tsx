import { CalendarEvent } from "@/types/events";

interface EventCardStatusProps {
  status: CalendarEvent['status'];
}

export function EventCardStatus({ status }: EventCardStatusProps) {
  const getStatusBackground = (status: string) => {
    switch (status) {
      case 'proposed':
      case 'confirmed':
      case 'invoice ready':
      case 'cancelled':
        return 'bg-zinc-800/75 hover:bg-zinc-800/90';
      default:
        return 'hover:bg-zinc-800/90';
    }
  };

  return getStatusBackground(status);
}