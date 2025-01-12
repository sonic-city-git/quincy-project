import { EVENT_COLORS } from "@/constants/eventColors";

interface EventStatusBadgeProps {
  typeName: string;
}

export function EventStatusBadge({ typeName }: EventStatusBadgeProps) {
  return (
    <span className={`text-sm px-2 py-1 rounded-md bg-opacity-75 ${EVENT_COLORS[typeName]}`}>
      {typeName}
    </span>
  );
}