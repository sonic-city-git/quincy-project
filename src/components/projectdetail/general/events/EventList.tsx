import { CalendarEvent } from "@/types/events";
import { EventSection } from "./EventSection";
import { EventListEmpty } from "./EventListEmpty";
import { EventListLoading } from "./EventListLoading";
import { eventUtils } from "./utils";
import { Card } from "@/components/ui/card";
import { Brush, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { COMPONENT_CLASSES, RESPONSIVE } from "@/design-system";

interface EventListProps {
  events: CalendarEvent[];
  isLoading?: boolean;
  onStatusChange: (event: CalendarEvent, newStatus: CalendarEvent['status']) => void;
  onEdit: (event: CalendarEvent) => void;
}

export function EventList({ events, isLoading, onStatusChange, onEdit }: EventListProps) {
  if (isLoading) {
    return <EventListLoading />;
  }

  if (!events.length) {
    return <EventListEmpty />;
  }

  // Filter out null/undefined events before grouping
  const validEvents = events.filter(event => event && event.date && event.status);
  const { proposed, confirmed, ready, cancelled, doneAndDusted } = eventUtils.groupEventsByStatus(validEvents);

  const sections = [
    { title: "Proposed", events: proposed, variant: "warning" as const },
    { title: "Confirmed", events: confirmed, variant: "success" as const },
    { title: "Invoice Ready", events: ready, variant: "info" as const },
    { title: "Cancelled", events: cancelled, variant: "critical" as const }
  ];

  return (
    <div className={cn(RESPONSIVE.spacing.section)}>
      {/* Active Event Sections */}
      <div className="space-y-4">
        {sections.map(({ title, events, variant }) => (
          events.length > 0 && (
            <Card 
              key={title}
              className={cn(
                COMPONENT_CLASSES.card.default,
                'overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200'
              )}
            >
              <EventSection
                title={title}
                events={events}
                onStatusChange={onStatusChange}
                onEdit={onEdit}
                variant={variant}
              />
            </Card>
          )
        ))}
      </div>

      {/* Done and Dusted - Collapsible Archive */}
      {doneAndDusted.length > 0 && (
        <div className="mt-8">
          <Collapsible defaultOpen={false}>
            <Card className={cn(
              COMPONENT_CLASSES.card.subtle,
              'transition-all duration-200'
            )}>
              <CollapsibleTrigger className={cn(
                'flex items-center justify-between w-full p-4',
                'hover:bg-muted/30 transition-all duration-200',
                'group'
              )}>
                <div className="flex items-center gap-3">
                  <Brush className="h-5 w-5 text-muted-foreground/70 group-hover:text-foreground/90 transition-colors" />
                  <div className="text-left">
                    <h3 className="text-lg font-bold tracking-tight text-muted-foreground/80 group-hover:text-foreground/90 transition-colors">
                      Done and Dusted
                    </h3>
                    <p className="text-sm text-muted-foreground/70 font-medium">
                      {doneAndDusted.length} archived event{doneAndDusted.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <ChevronDown className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-all duration-200 group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              
              <CollapsibleContent className="border-t border-border/20">
                <div className="p-3 space-y-1">
                  {doneAndDusted.map((event) => (
                    <EventSection
                      key={event.id}
                      title="Done and Dusted"
                      events={[event]}
                      onStatusChange={onStatusChange}
                      onEdit={undefined}
                      hideEdit
                      hideHeader
                      variant="operational"
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>
      )}
    </div>
  );
}