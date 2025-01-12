import { Card } from "@/components/ui/card";

export function EventListLoading() {
  return (
    <Card className="p-6">
      <div className="h-[200px] flex items-center justify-center text-muted-foreground">
        Loading events...
      </div>
    </Card>
  );
}