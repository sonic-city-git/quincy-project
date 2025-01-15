interface EmptyDropZoneProps {
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  children: React.ReactNode;
}

export function EmptyDropZone({ onDragOver, onDrop, children }: EmptyDropZoneProps) {
  return (
    <div 
      className="h-full overflow-y-auto space-y-6 pr-4"
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {children}
    </div>
  );
}