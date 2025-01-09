import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutDashboard, CalendarDays } from "lucide-react";

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
      isActive: isActive("/")
    },
    { 
      href: "/projects", 
      label: "Projects", 
      icon: CalendarDays,
      isActive: isActive("/projects")
    }
  ];

  return (
    <div className="pb-12 w-64 bg-zinc-900">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="space-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-zinc-400 transition-all hover:text-zinc-100",
                  link.isActive && "bg-zinc-800 text-zinc-100"
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