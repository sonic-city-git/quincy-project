import { Card } from "@/components/ui/card";

export function EventListEmpty() {
  return (
    <Card className="p-6">
      <div className="h-[200px] flex items-center justify-center text-muted-foreground">
        No events found. Click on the calendar to add events.
      </div>
    </Card>
  );
}