import { ReactNode } from "react";

interface EventSectionHeaderGridProps {
  children: ReactNode;
}

export function EventSectionHeaderGrid({ children }: EventSectionHeaderGridProps) {
  return (
    <div className="grid grid-cols-[100px_165px_30px_30px_30px_30px_1fr_100px_40px_40px] gap-2 items-center">
      {/* Column widths breakdown:
        1. Status icon + number: 100px
        2. Title: 165px
        3. Location icon: 30px
        4. Equipment icon: 30px
        5. Empty space (was crew): 30px
        6. Empty space: 30px
        7. Flexible space: 1fr
        8. Status manager: 100px
        9. Action button: 40px
        10. Empty space: 40px
      */}
      {children}
    </div>
  );
}