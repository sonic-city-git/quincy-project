import { RESPONSIVE, cn } from "@/design-system";

interface EmptyDropZoneProps {
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  children: React.ReactNode;
  className?: string;
}

export function EmptyDropZone({ 
  onDragOver, 
  onDrop, 
  children, 
  className 
}: EmptyDropZoneProps) {
  return (
    <div 
      className={cn(
        "h-full",
        className
      )}
      onDragOver={onDragOver}
      onDrop={onDrop}
      role="region"
      aria-label="Equipment drop zone"
    >
      {children}
    </div>
  );
}