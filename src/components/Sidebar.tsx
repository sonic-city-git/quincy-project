import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutDashboard, CalendarDays, Users, Package, LogOut } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/components/AuthProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    <div className="flex flex-col h-screen w-64 bg-zinc-900">
      <div className="px-3 py-4 border-b border-zinc-800">
        <h1 className="text-5xl font-bold text-accent px-3">
          QUINCY
        </h1>
      </div>
      <div className="px-3 py-2 flex-1">
        <div className="space-y-1">
          {links.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              onClick={link.onClick}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-zinc-400 transition-all",
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
      <div className="p-3 border-t border-zinc-800">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex justify-center rounded-lg p-2 text-zinc-400 transition-all hover:bg-zinc-800">
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