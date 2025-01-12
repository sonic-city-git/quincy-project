interface EventSectionHeaderProps {
  title: string;
  eventCount: number;
}

export function EventSectionHeader({ title, eventCount }: EventSectionHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold">{title}</h3>
      <span className="text-sm text-muted-foreground">{eventCount} events</span>
    </div>
  );
}