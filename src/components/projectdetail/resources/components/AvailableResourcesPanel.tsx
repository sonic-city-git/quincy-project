/**
 * 🎯 STOCK EQUIPMENT PANEL - LEFT SIDEBAR
 * 
 * ✅ Shows available stock equipment to add to variants
 * ✅ Design system compliant with StatusCard patterns
 * ✅ Simple equipment selection interface
 */

import { Box, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { STATUS_COLORS } from '@/components/dashboard/shared/StatusCard';
import { COMPONENT_CLASSES, cn } from '@/design-system';
import { EquipmentSelector } from '../equipment/components/EquipmentSelector';
import { Equipment } from '@/types/equipment';
import { useState, useEffect, useRef } from 'react';

interface AvailableResourcesPanelProps {
  projectId: string;
  selectedVariant: string;
  selectedGroupId: string | null;
  selectedGroupName: string | null;
  hasGroups: boolean;
  onEquipmentAdd: (equipment: Equipment) => Promise<void>;
}

export function AvailableResourcesPanel({ 
  projectId, 
  selectedVariant,
  selectedGroupId,
  selectedGroupName,
  hasGroups,
  onEquipmentAdd
}: AvailableResourcesPanelProps) {
  const infoColors = STATUS_COLORS.info;
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts: ESC to clear search
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // ESC to clear search and unfocus
      if (event.key === 'Escape' && searchQuery) {
        event.preventDefault();
        setSearchQuery('');
        searchInputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery]);

  return (
    <Card className={cn(
      'h-full flex flex-col overflow-hidden',
      'bg-gradient-to-br', infoColors.bg,
      'border', infoColors.border,
      'shadow-sm hover:shadow-md transition-shadow duration-200'
    )}>
      <div className="flex flex-col h-full overflow-auto">
        {/* Consolidated Sticky Header */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md flex-shrink-0 shadow-sm border-b border-border/30">
          {/* Main Header */}
          <div className="px-4 py-3 border-b border-border/20">
            <div className="flex items-center gap-3">
              <Box className={cn('h-5 w-5 flex-shrink-0', infoColors.text)} />
              <h2 className="font-semibold text-lg leading-none text-foreground">Stock Equipment</h2>
            </div>
          </div>
          
          {/* Group Status */}
          <div className="px-4 py-2.5 border-b border-border/20">
            {selectedGroupId ? (
              <div className="flex items-center gap-2">
                <div className={cn('w-2 h-2 rounded-full flex-shrink-0', STATUS_COLORS.operational.bg)} />
                <p className={cn('text-xs font-semibold leading-none', STATUS_COLORS.operational.text)}>
                  Adding to: {selectedGroupName || 'Selected Group'}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/40 flex-shrink-0" />
                <p className="text-xs font-semibold text-muted-foreground leading-none">
                  No group selected
                </p>
              </div>
            )}
          </div>
          
          {/* Search Field */}
          <div className="px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
              <Input
                ref={searchInputRef}
                placeholder="Search equipment..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 bg-muted/30 border-border/40 focus:bg-background focus:border-primary/50 transition-colors h-9"
                aria-label="Search equipment by name or code (Press ESC to clear)"
              />
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-hidden">
          <EquipmentSelector 
            onSelect={onEquipmentAdd}
            projectId={projectId}
            selectedGroupId={selectedGroupId}
            searchQuery={searchQuery}
            stickySearch={false}
          />
        </div>
      </div>
    </Card>
  );
}