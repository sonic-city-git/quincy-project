import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef } from "react";

interface Entity {
  id: string;
  name: string;
}

interface EntitySelectProps {
  entities: Entity[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  isLoading?: boolean;
  required?: boolean;
}

export function EntitySelect({ 
  entities, 
  value, 
  onValueChange, 
  placeholder,
  isLoading,
  required
}: EntitySelectProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  console.log('EntitySelect received entities:', entities);
  console.log('EntitySelect current value:', value);

  const getDisplayValue = () => {
    const selectedEntity = entities.find(e => e.id === value);
    return selectedEntity?.name || (isLoading ? 'Loading...' : placeholder);
  };

  // Custom sort function to prioritize specific names
  const sortedEntities = [...entities].sort((a, b) => {
    const order = ['Sonic City', 'Associate', 'Freelance'];
    const aIndex = order.indexOf(a.name);
    const bIndex = order.indexOf(b.name);
    
    // If both items are in the priority list, sort by their order
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }
    // If only a is in the priority list, it comes first
    if (aIndex !== -1) return -1;
    // If only b is in the priority list, it comes first
    if (bIndex !== -1) return 1;
    // For all other items, sort alphabetically
    return a.name.localeCompare(b.name);
  });

  console.log('EntitySelect sorted entities:', sortedEntities);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let touchStartY = 0;
    let isScrolling = false;

    const handleWheel = (e: WheelEvent) => {
      // Detect if the event is from a touchpad based on deltaMode and deltaY
      const isTouchpad = e.deltaMode === 0 && Math.abs(e.deltaY) < 50;
      
      if (isTouchpad) {
        e.preventDefault();
        scrollContainer.scrollTop += e.deltaY;
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
      isScrolling = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isScrolling) return;
      
      const touchDeltaY = touchStartY - e.touches[0].clientY;
      scrollContainer.scrollTop += touchDeltaY;
      touchStartY = e.touches[0].clientY;
      
      // Prevent default only if we're scrolling
      if (Math.abs(touchDeltaY) > 5) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = () => {
      isScrolling = false;
    };

    try {
      scrollContainer.addEventListener('wheel', handleWheel, { passive: false });
      scrollContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
      scrollContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
      scrollContainer.addEventListener('touchend', handleTouchEnd);

      return () => {
        scrollContainer.removeEventListener('wheel', handleWheel);
        scrollContainer.removeEventListener('touchstart', handleTouchStart);
        scrollContainer.removeEventListener('touchmove', handleTouchMove);
        scrollContainer.removeEventListener('touchend', handleTouchEnd);
      };
    } catch (error) {
      console.error('Error setting up scroll handlers:', error);
    }
  }, []);

  return (
    <Select 
      value={value} 
      onValueChange={onValueChange}
      required={required}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={getDisplayValue()} />
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        <ScrollArea 
          ref={scrollRef}
          className="h-full max-h-[300px] overflow-y-auto" 
          type="auto"
          style={{ scrollBehavior: 'smooth' }}
        >
          {sortedEntities.map((entity) => (
            <SelectItem 
              key={entity.id} 
              value={entity.id}
              className="cursor-pointer relative flex w-full select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-accent hover:text-accent-foreground"
            >
              {entity.name}
            </SelectItem>
          ))}
        </ScrollArea>
      </SelectContent>
    </Select>
  );
}