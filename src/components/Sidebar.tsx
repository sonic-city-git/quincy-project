import { NavLink } from "react-router-dom";
import { LayoutDashboard, Package, Users, AlertTriangle, Mic, User } from "lucide-react";

export function Sidebar() {
  const links = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/" },
    { name: "Projects", icon: Package, path: "/projects" },
    { name: "Equipment", icon: Mic, path: "/equipment" },
    { name: "Crew", icon: Users, path: "/crew" },
    { name: "Customers", icon: User, path: "/customers" },
    { name: "Shortages", icon: AlertTriangle, path: "/shortages" },
  ];

  return (
    <aside className="min-h-screen bg-zinc-900/50 backdrop-blur-sm p-6 flex flex-col border-r border-zinc-800/50 flex-shrink-0 w-[200px]">
      <div className="mb-10">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-amber-700 bg-clip-text text-transparent">
          QUINCY
        </h1>
      </div>
      <nav className="space-y-1.5">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-md transition-all duration-200 ${
                isActive
                  ? "bg-zinc-800/80 text-white font-medium shadow-sm"
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
              }`
            }
          >
            <link.icon className="h-4 w-4" />
            {link.name}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto text-zinc-500 text-sm font-medium">
        SONIC CITY - 2024
      </div>
    </aside>
  );
}