import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutDashboard, CalendarDays, Users } from "lucide-react";

export function Sidebar() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const links = [
    { 
      href: "/", 
      label: "Dashboard", 
      icon: LayoutDashboard,
      isActive: isActive("/"),
      bgColor: "hover:bg-[#9b87f5]/10" // Primary purple hover
    },
    { 
      href: "/projects", 
      label: "Projects", 
      icon: CalendarDays,
      isActive: isActive("/projects"),
      bgColor: "hover:bg-[#7E69AB]/10" // Secondary purple hover
    },
    { 
      href: "/crew", 
      label: "Crew", 
      icon: Users,
      isActive: isActive("/crew"),
      bgColor: "hover:bg-[#F97316]/10" // Accent orange hover
    }
  ];

  return (
    <div className="pb-12 w-64 bg-[#F1F0FB] dark:bg-zinc-900">
      <div className="px-3 py-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-center mb-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#9b87f5] to-[#7E69AB] bg-clip-text text-transparent">
            QUINCY
          </h1>
        </div>
      </div>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="space-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-zinc-500 transition-all",
                  link.bgColor,
                  "hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
                  link.isActive && "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}