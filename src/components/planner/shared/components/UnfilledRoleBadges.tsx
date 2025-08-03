import { memo } from 'react';
import { Badge } from '../../../ui/badge';
import { LAYOUT } from '../constants';

interface UnfilledRoleBadgesProps {
  roles: Array<{
    id: string;
    role: string;
    projectName: string;
    eventName: string;
    eventTypeColor: string;
  }>;
  dateStr: string;
  onRoleClick?: (roleId: string, date: string) => void;
}

const UnfilledRoleBadgesComponent = ({
  roles,
  dateStr,
  onRoleClick
}: UnfilledRoleBadgesProps) => {
  return (
    <div 
      className="flex flex-wrap gap-1 items-center justify-center p-1"
      style={{ width: LAYOUT.DAY_CELL_WIDTH }}
    >
      {roles?.map((role) => (
        <Badge
          key={role.id}
          variant="outline"
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          style={{ 
            borderColor: role.eventTypeColor,
            color: role.eventTypeColor
          }}
          onClick={() => onRoleClick?.(role.id, dateStr)}
          title={`${role.role} needed for ${role.eventName} (${role.projectName})`}
        >
          ⚠️
        </Badge>
      ))}
    </div>
  );
};

export const UnfilledRoleBadges = memo(UnfilledRoleBadgesComponent);