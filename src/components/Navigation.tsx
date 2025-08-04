import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutDashboard, CalendarDays, Calendar, Users, Package, LogOut, Database, Settings } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/components/AuthProvider";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SettingsDialog } from "@/components/SettingsDialog";

export function TopNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  // Remove mobile menu state - no longer needed
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleProjectsClick = () => {
    queryClient.invalidateQueries({ queryKey: ['projects'] });
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/auth');
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  const handleSettings = () => {
    setIsSettingsOpen(true);
  };

  const handleMobileLinkClick = (onClick?: () => void) => {
    if (onClick) onClick();
  };

  const links = [
    { 
      href: "/", 
      label: "Dashboard", 
      icon: LayoutDashboard,
      isActive: isActive("/"),
      onClick: () => {
        // Set flag for app navigation to preserve tab choice
        sessionStorage.setItem('dashboard-app-navigation', 'true');
      }
    },
    { 
      href: "/projects", 
      label: "Projects", 
      icon: CalendarDays,
      isActive: isActive("/projects"),
      onClick: handleProjectsClick
    },
    { 
      href: "/planner", 
      label: "Planner", 
      icon: Calendar,
      isActive: isActive("/planner"),
      onClick: () => {}
    },
    { 
      href: "/resources", 
      label: "Resources", 
      icon: Database,
      isActive: isActive("/resources"),
      onClick: () => {}
    }
  ];

  return (
    <nav className="sticky top-0 z-50 bg-zinc-900 border-b border-zinc-800 px-4 md:px-6 py-3">
      <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
        {/* Logo */}
        <div className="flex items-center">
          <h1 className="text-xl md:text-2xl font-bold text-accent">
            QUINCY
          </h1>
        </div>

        {/* Desktop Navigation Links - Full text + icons */}
        <div className="hidden md:flex items-center space-x-1">
          {links.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              onClick={link.onClick}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-zinc-400 transition-all",
                "hover:text-zinc-100 hover:bg-zinc-800",
                link.isActive && "bg-zinc-800 text-zinc-100"
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </div>

        {/* Mobile Navigation Links - Icon only */}
        <div className="flex md:hidden items-center space-x-1">
          {links.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              onClick={link.onClick}
              className={cn(
                "flex items-center justify-center rounded-lg p-3 text-zinc-400 transition-all relative group",
                "hover:text-zinc-100 hover:bg-zinc-800 active:scale-95",
                link.isActive && "bg-zinc-800 text-zinc-100"
              )}
              title={link.label}
            >
              <link.icon className="h-5 w-5" />
              
              {/* Active indicator dot */}
              {link.isActive && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-accent rounded-full" />
              )}
              
              {/* Tooltip on hover/touch */}
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-zinc-800 text-zinc-100 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                {link.label}
              </div>
            </Link>
          ))}
        </div>

        {/* Right side - User menu */}
        <div className="flex items-center gap-2">
          {/* User Menu */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-lg p-2 text-zinc-400 transition-all hover:bg-zinc-800 hover:text-zinc-100 active:scale-95">
                  <Avatar className="h-8 w-8">
                    <AvatarImage 
                      src={session?.user?.user_metadata?.avatar_url} 
                      alt={session?.user?.email || 'User avatar'} 
                    />
                    <AvatarFallback className="bg-zinc-800 text-zinc-400">
                      {session?.user?.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={handleSettings}
                className="text-zinc-300 focus:text-zinc-100 focus:bg-zinc-800"
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleLogout}
                className="text-red-500 focus:text-red-500 focus:bg-red-500/10"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
            <span className="text-sm font-medium hidden lg:block text-zinc-300">
              {session?.user?.email?.split('@')[0] || 'User'}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu removed - using icon navigation instead */}

      {/* Settings Dialog */}
      <SettingsDialog 
        open={isSettingsOpen} 
        onOpenChange={setIsSettingsOpen} 
      />
    </nav>
  );
}

