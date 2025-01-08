import { Card } from "@/components/ui/card";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { RoleInfo } from "./RoleInfo";

interface ProjectRoleCardProps {
  id: string;
  projectId: string;
  name: string;
  color: string;
  quantity: number;
  dailyRate?: number | null;
  hourlyRate?: number | null;
  onUpdate?: () => void;
}

export function ProjectRoleCard({ 
  id,
  projectId,
  name, 
  color, 
  quantity,
  dailyRate,
  hourlyRate,
  onUpdate
}: ProjectRoleCardProps) {
  return (
    <Card className="p-2">
      <div className="flex items-center gap-6">
        <RoleInfo quantity={quantity} color={color} name={name} />
        <div className="flex items-center gap-6">
          <span className="w-24 text-sm">{dailyRate || '-'}</span>
          <span className="w-24 text-sm">{hourlyRate || '-'}</span>
        </div>
      </div>
    </Card>
  );
}