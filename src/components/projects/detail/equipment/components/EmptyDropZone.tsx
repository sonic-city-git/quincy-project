import { ScrollArea } from "@/components/ui/scroll-area";
import React from "react";

interface EmptyDropZoneProps {
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

export function EmptyDropZone({ onDragOver, onDrop }: EmptyDropZoneProps) {
  return (
    <ScrollArea 
      className="h-full"
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(e);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop(e);
      }}
    />
  );
}