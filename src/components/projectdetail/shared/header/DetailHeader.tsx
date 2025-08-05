import { Archive, MoreVertical, Settings, Layers, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { COMPONENT_CLASSES, RESPONSIVE, cn } from "@/design-system";

interface DetailHeaderProps {
  activeTab: 'general' | 'variants' | 'financial';
  onTabChange: (tab: 'general' | 'variants' | 'financial') => void;
  canArchive: boolean;
  onArchiveClick: () => void;
}

export function DetailHeader({
  activeTab,
  onTabChange,
  canArchive,
  onArchiveClick
}: DetailHeaderProps) {

  const getTabConfig = () => {
    switch (activeTab) {
      case 'variants':
        return { 
          title: 'Project Variants', 
          icon: Layers, 
          color: 'text-primary',
          activeClasses: 'bg-primary/10 text-primary border-primary/20'
        };
      case 'financial':
        return { 
          title: 'Project Financial', 
          icon: DollarSign, 
          color: 'text-accent',
          activeClasses: 'bg-accent/10 text-accent border-accent/20'
        };
      default:
        return { 
          title: 'Project General', 
          icon: Settings, 
          color: 'text-secondary',
          activeClasses: 'bg-secondary/10 text-secondary border-secondary/20'
        };
    }
  };

  const { title, icon: IconComponent, color: iconColor, activeClasses } = getTabConfig();

  return (
    <div className={cn(
      "sticky top-[72px] z-40 bg-background/95 backdrop-blur-sm",
      COMPONENT_CLASSES.card.default
    )}>
      {/* Header with Title, Actions, and Tab Toggle */}
      <div className={cn(
        RESPONSIVE.flex.header,
        "py-3 px-4 bg-background border-b border-border/30"
      )}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <IconComponent className={cn("h-5 w-5", iconColor)} />
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          </div>
        </div>
        
        {/* Action Menu and Tab Toggle */}
        <div className="flex items-center gap-4">
          {/* Action Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={onArchiveClick}
                disabled={!canArchive}
                className="gap-2 text-xs"
              >
                <Archive className="h-3 w-3" />
                Archive Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Tab Toggle */}
          <div className="flex bg-muted rounded-lg p-1">
            <Button
              variant={activeTab === 'general' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onTabChange('general')}
              className={cn(
                "flex items-center gap-2 transition-colors",
                activeTab === 'general' ? 'bg-secondary/10 text-secondary border-secondary/20' : 'hover:bg-muted/50'
              )}
              aria-pressed={activeTab === 'general'}
              aria-label="Switch to General tab"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">General</span>
            </Button>
            <Button
              variant={activeTab === 'variants' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onTabChange('variants')}
              className={cn(
                "flex items-center gap-2 transition-colors",
                activeTab === 'variants' ? 'bg-primary/10 text-primary border-primary/20' : 'hover:bg-muted/50'
              )}
              aria-pressed={activeTab === 'variants'}
              aria-label="Switch to Variants tab"
            >
              <Layers className="h-4 w-4" />
              <span className="hidden sm:inline">Variants</span>
            </Button>
            <Button
              variant={activeTab === 'financial' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onTabChange('financial')}
              className={cn(
                "flex items-center gap-2 transition-colors",
                activeTab === 'financial' ? 'bg-accent/10 text-accent border-accent/20' : 'hover:bg-muted/50'
              )}
              aria-pressed={activeTab === 'financial'}
              aria-label="Switch to Financial tab"
            >
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Financial</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}