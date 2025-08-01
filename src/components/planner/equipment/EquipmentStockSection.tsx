import { Collapsible, CollapsibleContent } from "../../ui/collapsible";
import { LAYOUT } from '../constants';
import { EquipmentGroup } from '../types';

interface EquipmentStockSectionProps {
  equipmentGroup: EquipmentGroup;
  expandedGroups: Set<string>;
  getLowestAvailable: (equipmentId: string) => number;
}

export function EquipmentStockSection({
  equipmentGroup,
  expandedGroups,
  getLowestAvailable
}: EquipmentStockSectionProps) {
  const { mainFolder, equipment: mainEquipment, subFolders } = equipmentGroup;
  const isExpanded = expandedGroups.has(mainFolder);

  return (
    <Collapsible open={isExpanded}>
      <div style={{ height: LAYOUT.MAIN_FOLDER_HEIGHT }} className="border-b border-border" />
      
      <CollapsibleContent>
        {/* Main folder equipment lowest available */}
        {mainEquipment.map((equipment) => (
          <div 
            key={equipment.id} 
            className="flex items-center justify-center border-b border-border"
            style={{ height: LAYOUT.EQUIPMENT_ROW_HEIGHT }}
          >
            <span className="text-sm font-medium text-muted-foreground">
              {getLowestAvailable(equipment.id)}
            </span>
          </div>
        ))}
        
        {/* Subfolders lowest available */}
        {subFolders.map((subFolder) => {
          const subFolderKey = `${mainFolder}/${subFolder.name}`;
          const isSubfolderExpanded = expandedGroups.has(subFolderKey);
          
          return (
            <Collapsible key={subFolder.name} open={isSubfolderExpanded}>
              <div style={{ height: LAYOUT.SUBFOLDER_HEIGHT }} className="border-t border-border" />
              <CollapsibleContent>
                {subFolder.equipment.map((equipment) => (
                  <div 
                    key={equipment.id} 
                    className="flex items-center justify-center border-b border-border"
                    style={{ height: LAYOUT.EQUIPMENT_ROW_HEIGHT }}
                  >
                    <span className="text-sm font-medium text-muted-foreground">
                      {getLowestAvailable(equipment.id)}
                    </span>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </CollapsibleContent>
    </Collapsible>
  );
}