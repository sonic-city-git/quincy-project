// Crew Roles List Component
// Displays and manages crew roles for a specific variant

import { useState } from 'react';
import { MoreHorizontal, User, DollarSign, Clock, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { VariantCrewRole } from '@/types/variants';
import { formatPrice } from '@/utils/priceFormatters';

interface CrewRolesListProps {
  projectId: string;
  variantName: string;
  crewRoles: VariantCrewRole[];
  onAddRole: (roleData: Omit<VariantCrewRole, 'id' | 'project_id' | 'variant_name'>) => Promise<VariantCrewRole>;
  onUpdateRole: (roleId: string, updates: Partial<VariantCrewRole>) => Promise<VariantCrewRole>;
  onRemoveRole: (roleId: string) => Promise<void>;
}

export function CrewRolesList({
  projectId,
  variantName,
  crewRoles,
  onAddRole,
  onUpdateRole,
  onRemoveRole
}: CrewRolesListProps) {
  const [editingRole, setEditingRole] = useState<string | null>(null);

  if (crewRoles.length === 0) {
    return (
      <div className="text-center py-8 border border-dashed border-border rounded-lg">
        <User className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <h4 className="font-medium text-muted-foreground mb-2">No crew roles configured</h4>
        <p className="text-sm text-muted-foreground mb-4">
          Add crew roles to define who you need for this variant
        </p>
        <Button size="sm" variant="outline">
          Add First Role
        </Button>
      </div>
    );
  }

  // Group roles by category (could be extended to support role categories)
  const sortedRoles = [...crewRoles].sort((a, b) => {
    // Sort by daily rate descending, then by role name
    const rateA = a.daily_rate || 0;
    const rateB = b.daily_rate || 0;
    if (rateA !== rateB) {
      return rateB - rateA;
    }
    return a.role.name.localeCompare(b.role.name);
  });

  const handleEditRole = (roleId: string) => {
    setEditingRole(roleId);
  };

  const handleRemoveRole = async (roleId: string) => {
    try {
      await onRemoveRole(roleId);
    } catch (error) {
      console.error('Error removing role:', error);
    }
  };

  return (
    <div className="space-y-3">
      {sortedRoles.map((role) => (
        <CrewRoleCard
          key={role.id}
          role={role}
          onEdit={() => handleEditRole(role.id)}
          onRemove={() => handleRemoveRole(role.id)}
        />
      ))}
    </div>
  );
}

interface CrewRoleCardProps {
  role: VariantCrewRole;
  onEdit: () => void;
  onRemove: () => void;
}

function CrewRoleCard({ role, onEdit, onRemove }: CrewRoleCardProps) {
  const { role: roleInfo, preferred_member, daily_rate, hourly_rate, hourly_category } = role;

  // Determine primary rate display
  const primaryRate = daily_rate || hourly_rate;
  const rateType = daily_rate ? 'daily' : hourly_rate ? 'hourly' : null;

  // Get role color for badge
  const roleColor = roleInfo.color || '#6366f1';

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Left side - Role info */}
          <div className="flex items-center gap-3 flex-1">
            {/* Role badge */}
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: roleColor }}
            />
            
            {/* Role details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-sm truncate">
                  {roleInfo.name}
                </h4>
                
                {/* Rate badge */}
                {primaryRate && (
                  <Badge variant="outline" className="text-xs">
                    <DollarSign className="h-3 w-3 mr-1" />
                    {formatPrice(primaryRate)}/{rateType}
                  </Badge>
                )}
                
                {/* Hourly category for hourly rates */}
                {hourly_rate && hourly_category && (
                  <Badge variant="secondary" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {hourly_category}
                  </Badge>
                )}
              </div>
              
              {/* Preferred crew member */}
              {preferred_member && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={preferred_member.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {preferred_member.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span>Preferred: {preferred_member.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-2">
            {/* Rate display (detailed) */}
            <div className="text-right text-xs text-muted-foreground mr-2">
              {daily_rate && (
                <div>{formatPrice(daily_rate)}/day</div>
              )}
              {hourly_rate && (
                <div>{formatPrice(hourly_rate)}/hr</div>
              )}
              {!daily_rate && !hourly_rate && (
                <div className="text-muted-foreground">No rate set</div>
              )}
            </div>

            {/* Actions dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit} className="gap-2">
                  <Pencil className="h-4 w-4" />
                  Edit Role
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  onClick={onRemove} 
                  className="gap-2 text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove Role
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}