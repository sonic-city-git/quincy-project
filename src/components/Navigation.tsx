import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutDashboard, CalendarDays, Calendar, Users, Package, LogOut, Menu, X, Database, Settings } from "lucide-react";
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
    setIsMobileMenuOpen(false);
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

        {/* Desktop Navigation Links */}
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

        {/* Right side - User menu and mobile menu button */}
        <div className="flex items-center gap-2">
          {/* User Menu */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-lg p-2 text-zinc-400 transition-all hover:bg-zinc-800 hover:text-zinc-100">
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

          {/* Mobile Menu Button */}
          <button
            className="md:hidden rounded-lg p-3 text-zinc-400 transition-all hover:bg-zinc-800 hover:text-zinc-100"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-800 mt-3 pt-3">
          <div className="space-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => handleMobileLinkClick(link.onClick)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-4 text-base font-medium text-zinc-400 transition-all",
                  "hover:text-zinc-100 hover:bg-zinc-800",
                  link.isActive && "bg-zinc-800 text-zinc-100"
                )}
              >
                <link.icon className="h-5 w-5" />
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Settings Dialog */}
      <SettingsDialog 
        open={isSettingsOpen} 
        onOpenChange={setIsSettingsOpen} 
      />
    </nav>
  );
}

