/**
 * CONSOLIDATED: ProjectTabWrapper - Eliminates TabsContent duplication
 * 
 * Replaces repetitive TabsContent patterns across ProjectTabs.tsx
 * Provides consistent tab content wrapper with proper mounting and visibility
 */

import { ReactNode } from 'react';
import { TabsContent } from "@/components/ui/tabs";

export interface ProjectTabWrapperProps {
  value: string;
  currentTab: string;
  children: ReactNode;
  className?: string;
}

/**
 * Unified TabsContent wrapper with standardized props
 */
export function ProjectTabWrapper({
  value,
  currentTab,
  children,
  className = "h-full mt-0"
}: ProjectTabWrapperProps) {
  return (
    <TabsContent 
      value={value} 
      className={className}
      forceMount 
      hidden={currentTab !== value}
    >
      {children}
    </TabsContent>
  );
}

/**
 * Higher-order component for project tab props standardization
 */
export interface BaseProjectTabProps {
  projectId: string;
}

/**
 * Utility function to create consistent project tab interfaces
 */
export function createProjectTabProps<T extends Record<string, any> = {}>(
  additionalProps?: T
): BaseProjectTabProps & T {
  return {
    projectId: '',
    ...additionalProps
  } as BaseProjectTabProps & T;
}

/**
 * Generic project tab component wrapper with loading states
 */
export interface ProjectTabComponentProps extends BaseProjectTabProps {
  loading?: boolean;
  error?: Error | null;
  children: ReactNode;
}

export function ProjectTabComponent({
  projectId,
  loading = false,
  error = null,
  children
}: ProjectTabComponentProps) {
  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No project selected</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Error loading project data: {error.message}</p>
      </div>
    );
  }

  return <>{children}</>;
}