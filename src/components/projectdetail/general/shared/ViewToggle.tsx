import { Button } from "@/components/ui/button";
import { Grid, List } from "lucide-react";

interface ViewToggleProps {
  currentView: 'list' | 'grid';
  onViewChange: (view: 'list' | 'grid') => void;
}

export function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 bg-muted/50 rounded-md p-1">
      <Button
        variant="ghost"
        size="sm"
        className={`p-1 h-8 ${currentView === 'list' ? 'bg-muted' : ''}`}
        onClick={() => onViewChange('list')}
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={`p-1 h-8 ${currentView === 'grid' ? 'bg-muted' : ''}`}
        onClick={() => onViewChange('grid')}
      >
        <Grid className="h-4 w-4" />
      </Button>
    </div>
  );
}