import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutDashboard, CalendarDays, Calendar, Users, Package, LogOut, Menu, X } from "lucide-react";
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

export function TopNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      onClick: () => {}
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
      href: "/crew", 
      label: "Crew", 
      icon: Users,
      isActive: isActive("/crew"),
      onClick: () => {}
    },
    { 
      href: "/equipment", 
      label: "Equipment", 
      icon: Package,
      isActive: isActive("/equipment"),
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
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition-all",
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg p-2 text-zinc-400 transition-all hover:bg-zinc-800 hover:text-zinc-100">
                <Avatar className="h-8 w-8">
                  <AvatarImage 
                    src={session?.user?.user_metadata?.avatar_url} 
                    alt={session?.user?.email || 'User avatar'} 
                  />
                  <AvatarFallback className="bg-zinc-800 text-zinc-400">
                    {session?.user?.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden lg:block">
                  {session?.user?.email?.split('@')[0] || 'User'}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuItem 
                onClick={handleLogout}
                className="text-red-500 focus:text-red-500 focus:bg-red-500/10"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden rounded-lg p-2 text-zinc-400 transition-all hover:bg-zinc-800 hover:text-zinc-100"
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
                  "flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-zinc-400 transition-all",
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
    </nav>
  );
}

// Keep the old Sidebar for backward compatibility (can be removed later)
export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session } = useAuth();

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

  const links = [
    { 
      href: "/", 
      label: "Dashboard", 
      icon: LayoutDashboard,
      isActive: isActive("/"),
      bgColor: "hover:bg-[#9b87f5]/10",
      onClick: () => {}
    },
    { 
      href: "/projects", 
      label: "Projects", 
      icon: CalendarDays,
      isActive: isActive("/projects"),
      bgColor: "hover:bg-[#7E69AB]/10",
      onClick: handleProjectsClick
    },
    { 
      href: "/planner", 
      label: "Planner", 
      icon: Calendar,
      isActive: isActive("/planner"),
      bgColor: "hover:bg-[#0ea5e9]/10",
      onClick: () => {}
    },
    { 
      href: "/crew", 
      label: "Crew", 
      icon: Users,
      isActive: isActive("/crew"),
      bgColor: "hover:bg-[#F97316]/10",
      onClick: () => {}
    },
    { 
      href: "/equipment", 
      label: "Equipment", 
      icon: Package,
      isActive: isActive("/equipment"),
      bgColor: "hover:bg-[#22c55e]/10",
      onClick: () => {}
    }
  ];

  return (
    <div className="flex flex-col h-screen w-56 bg-zinc-900">
      <div className="px-2 py-3 border-b border-zinc-800">
        <h1 className="text-[45px] font-bold text-accent px-2">
          QUINCY
        </h1>
      </div>
      <div className="px-2 py-1.5 flex-1">
        <div className="space-y-0.5">
          {links.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              onClick={link.onClick}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-zinc-400 transition-all text-base",
                link.bgColor,
                "hover:text-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100",
                link.isActive && "bg-zinc-800 text-zinc-100"
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="p-2 border-t border-zinc-800">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex justify-center rounded-lg p-1.5 text-zinc-400 transition-all hover:bg-zinc-800">
              <Avatar className="h-7 w-7">
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
          <DropdownMenuContent align="start" className="w-[200px]">
            <DropdownMenuItem 
              onClick={handleLogout}
              className="text-red-500 focus:text-red-500 focus:bg-red-500/10"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}