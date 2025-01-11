import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutDashboard, CalendarDays, Users, Package, LogOut } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
    <div className="pb-12 w-64 bg-zinc-900">
      <div className="px-3 py-4 border-b border-zinc-800">
        <div className="flex items-center mb-4 px-3">
          <h1 className="text-5xl font-bold text-accent">
            QUINCY
          </h1>
        </div>
      </div>
      <div className="space-y-4 py-4 flex flex-col h-[calc(100%-120px)]">
        <div className="px-3 py-2">
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
        <div className="mt-auto px-3 py-2">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-zinc-400 transition-all hover:bg-red-500/10 hover:text-red-500"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}