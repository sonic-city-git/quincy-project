import { ReactNode } from "react";

interface EventCardGridProps {
  children: ReactNode;
}

export function EventCardGrid({ children }: EventCardGridProps) {
  return (
    <div className="grid grid-cols-[100px_140px_30px_30px_30px_30px_150px_40px_1fr_1fr_1fr] gap-2 items-center min-h-[48px]">
      {children}
    </div>
  );
}