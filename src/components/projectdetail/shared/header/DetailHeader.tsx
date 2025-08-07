import { Archive, MoreVertical, Building2, Database, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { COMPONENT_CLASSES, RESPONSIVE, cn } from "@/design-system";

interface DetailHeaderProps {
  activeTab: 'general' | 'resources' | 'financial';
  onTabChange: (tab: 'general' | 'resources' | 'financial') => void;
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
          case 'resources':
      return {
        title: 'Project Resources', 
          icon: Database, 
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
          icon: Building2, 
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
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">General</span>
            </Button>
            <Button
              variant={activeTab === 'resources' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onTabChange('resources')}
              className={cn(
                "flex items-center gap-2 transition-colors",
                activeTab === 'resources' ? 'bg-primary/10 text-primary border-primary/20' : 'hover:bg-muted/50'
              )}
              aria-pressed={activeTab === 'resources'}
              aria-label="Switch to Resources tab"
            >
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Resources</span>
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