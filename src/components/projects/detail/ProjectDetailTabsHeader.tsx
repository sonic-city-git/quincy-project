import { Archive, MoreVertical, Settings, Layers, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProjectDetailTabsHeaderProps {
  activeTab: 'general' | 'projectresources' | 'financial';
  onTabChange: (tab: 'general' | 'projectresources' | 'financial') => void;
  canArchive: boolean;
  onArchiveClick: () => void;
}

export function ProjectDetailTabsHeader({
  activeTab,
  onTabChange,
  canArchive,
  onArchiveClick
}: ProjectDetailTabsHeaderProps) {

  const getTabConfig = () => {
    switch (activeTab) {
      case 'projectresources':
        return { title: 'Project Variants', icon: Layers, color: 'text-indigo-500' };
      case 'financial':
        return { title: 'Project Financial', icon: DollarSign, color: 'text-blue-500' };
      default:
        return { title: 'Project General', icon: Settings, color: 'text-purple-500' };
    }
  };

  const { title, icon: IconComponent, color: iconColor } = getTabConfig();

  return (
    <div className="sticky top-[72px] z-40 bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-sm">
      {/* Header with Title, Actions, and Tab Toggle */}
      <div className="flex items-center justify-between py-3 px-4 bg-background border-b border-border/30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <IconComponent className={`h-5 w-5 ${iconColor}`} />
            <h3 className="text-lg font-semibold">{title}</h3>
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
              className={`flex items-center gap-2 ${
                activeTab === 'general' ? 'bg-purple-100 text-purple-700' : ''
              }`}
            >
              <Settings className="h-4 w-4" />
              General
            </Button>
            <Button
              variant={activeTab === 'projectresources' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onTabChange('projectresources')}
              className={`flex items-center gap-2 ${
                activeTab === 'projectresources' ? 'bg-indigo-100 text-indigo-700' : ''
              }`}
            >
              <Layers className="h-4 w-4" />
              Variants
            </Button>
            <Button
              variant={activeTab === 'financial' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onTabChange('financial')}
              className={`flex items-center gap-2 ${
                activeTab === 'financial' ? 'bg-blue-100 text-blue-700' : ''
              }`}
            >
              <DollarSign className="h-4 w-4" />
              Financial
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}