import { ChevronRightIcon, FolderIcon } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../ui/collapsible";
import { LAYOUT } from '../constants';
import { EquipmentGroup, EquipmentProjectUsage } from '../types';

interface EquipmentFolderSectionProps {
  equipmentGroup: EquipmentGroup;
  expandedGroups: Set<string>;
  expandedEquipment: Set<string>; // Equipment-level expansion state
  equipmentProjectUsage: Map<string, EquipmentProjectUsage>; // Project usage data
  toggleGroup: (groupName: string, expandAllSubfolders?: boolean) => void;
  formattedDates: Array<{
    date: Date;
    dateStr: string;
    isToday: boolean;
    isSelected: boolean;
    isWeekendDay: boolean;
  }>;
  bookingsData: Map<string, any> | undefined;
}

export function EquipmentFolderSection({
  equipmentGroup,
  expandedGroups,
  expandedEquipment,
  equipmentProjectUsage,
  toggleGroup,
  formattedDates,
  bookingsData
}: EquipmentFolderSectionProps) {
  const { mainFolder, equipment: mainEquipment, subFolders } = equipmentGroup;
  const isExpanded = expandedGroups.has(mainFolder);

  return (
    <Collapsible open={isExpanded}>
      <CollapsibleTrigger 
        className="w-full group/folder"
        onClick={(e) => {
          e.preventDefault();
          const isModifierClick = e.metaKey || e.ctrlKey;
          toggleGroup(mainFolder, isModifierClick);
        }}
      >
        <div 
          className="flex items-center gap-3 px-4 bg-background hover:bg-muted/50 transition-colors border-b border-border"
          style={{ height: LAYOUT.MAIN_FOLDER_HEIGHT }}
        >
          <ChevronRightIcon className="h-4 w-4 text-muted-foreground group-data-[state=open]/folder:rotate-90 transition-transform" />
          <FolderIcon className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-semibold text-foreground">
            {mainFolder}
            <span className="ml-2 text-xs text-muted-foreground opacity-0 group-hover/folder:opacity-100 transition-opacity">
              {navigator.platform.includes('Mac') ? '⌘+click' : 'Ctrl+click'} for all
            </span>
          </span>
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        {/* Main folder equipment */}
        {mainEquipment.map((equipment) => {
          const isEquipmentExpanded = expandedEquipment.has(equipment.id);
          const equipmentUsage = equipmentProjectUsage.get(equipment.id);
          
          return (
            <div key={equipment.id}>
              {/* Main equipment name row */}
              <div 
                className="flex items-center px-2 border-b border-border hover:bg-muted/30 transition-colors"
                style={{ height: LAYOUT.EQUIPMENT_ROW_HEIGHT }}
              >
                <div className="min-w-0 flex-1 pr-1">
                  <div className="text-xs font-medium truncate" title={equipment.name}>{equipment.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Stock: {equipment.stock}</div>
                </div>
              </div>
              
              {/* Project name rows when equipment is expanded */}
              {isEquipmentExpanded && equipmentUsage && equipmentUsage.projectNames.length > 0 && (
                <div>
                  {equipmentUsage.projectNames.map((projectName) => (
                    <div 
                      key={`${equipment.id}-${projectName}`}
                      className="flex items-center px-2 border-b border-gray-300 bg-gray-700"
                      style={{ height: LAYOUT.PROJECT_ROW_HEIGHT }}
                    >
                      <div className="min-w-0 flex-1 pr-1 pl-3">
                        <div className="text-xs font-medium text-white truncate flex items-center" title={projectName}>
                          <span className="text-gray-300 mr-2 text-[10px]">▸</span>
                          <span className="text-white font-semibold">{projectName}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        
        {/* Subfolders */}
        {subFolders.map((subFolder) => {
          const subFolderKey = `${mainFolder}/${subFolder.name}`;
          const isSubfolderExpanded = expandedGroups.has(subFolderKey);
          
          return (
            <Collapsible key={subFolder.name} open={isSubfolderExpanded}>
              <CollapsibleTrigger 
                className="w-full group/subfolder"
                onClick={() => toggleGroup(subFolderKey)}
              >
                <div 
                  className="flex items-center gap-3 px-4 pl-12 bg-muted/50 hover:bg-muted transition-colors border-t border-border"
                  style={{ height: LAYOUT.SUBFOLDER_HEIGHT }}
                >
                  <ChevronRightIcon className="h-4 w-4 text-muted-foreground group-data-[state=open]/subfolder:rotate-90 transition-transform" />
                  <span className="text-sm font-medium text-muted-foreground">{subFolder.name}</span>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                {subFolder.equipment.map((equipment) => {
                  const isEquipmentExpanded = expandedEquipment.has(equipment.id);
                  const equipmentUsage = equipmentProjectUsage.get(equipment.id);
                  
                  return (
                    <div key={equipment.id}>
                      {/* Main equipment name row */}
                      <div 
                        className="flex items-center px-4 border-b border-border hover:bg-muted/30 transition-colors"
                        style={{ height: LAYOUT.EQUIPMENT_ROW_HEIGHT }}
                      >
                        <div className="min-w-0 flex-1 pr-1">
                          <div className="text-xs font-medium truncate" title={equipment.name}>{equipment.name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">Stock: {equipment.stock}</div>
                        </div>
                      </div>
                      
                      {/* Project name rows when equipment is expanded */}
                      {isEquipmentExpanded && equipmentUsage && equipmentUsage.projectNames.length > 0 && (
                        <div>
                          {equipmentUsage.projectNames.map((projectName) => (
                            <div 
                              key={`${equipment.id}-${projectName}`}
                              className="flex items-center px-4 border-b border-gray-300 bg-gray-700"
                              style={{ height: LAYOUT.PROJECT_ROW_HEIGHT }}
                            >
                              <div className="min-w-0 flex-1 pr-1 pl-3">
                                <div className="text-xs font-medium text-white truncate flex items-center" title={projectName}>
                                  <span className="text-gray-300 mr-2 text-[10px]">▸</span>
                                  <span className="text-white font-semibold">{projectName}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </CollapsibleContent>
    </Collapsible>
  );
}