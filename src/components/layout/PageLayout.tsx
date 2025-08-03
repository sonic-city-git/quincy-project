import React from 'react';

interface PageLayoutProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  iconColor?: string;
  children: React.ReactNode;
}

/**
 * Unified page layout component that provides consistent structure across all main pages.
 * 
 * Eliminates duplication across Dashboard, Projects, Planner, Resources, and ProjectDetail pages.
 * 
 * @param icon - The icon component to display (e.g., LayoutDashboard, Calendar, etc.)
 * @param title - The page title
 * @param description - The page description/subtitle
 * @param iconColor - Tailwind color class for the icon (default: "text-blue-500")
 * @param children - The page content
 */
export function PageLayout({ 
  icon: Icon, 
  title, 
  description, 
  iconColor = "text-blue-500", 
  children 
}: PageLayoutProps) {
  return (
    <div className="container max-w-[1600px] p-8">
      {/* Standard page header - consistent across all pages */}
      <div className="flex items-center gap-4 mb-8">
        <Icon className={`h-8 w-8 ${iconColor}`} />
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </div>
      
      {/* Page content */}
      {children}
    </div>
  );
}