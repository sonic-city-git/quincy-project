import { NavLink } from "react-router-dom";
import { LayoutDashboard, Package, Users, AlertTriangle, Mic } from "lucide-react";

export function Sidebar() {
  const links = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/" },
    { name: "Projects", icon: Package, path: "/projects" },
    { name: "Equipment", icon: Mic, path: "/equipment" },
    { name: "Crew", icon: Users, path: "/crew" },
    { name: "Shortages", icon: AlertTriangle, path: "/shortages" },
  ];

  return (
    <aside className="fixed top-0 left-0 w-sidebar h-screen bg-zinc-900 p-3 flex flex-col border-r border-zinc-800">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-amber-600">QUINCY</h1>
      </div>
      <nav className="space-y-1.5">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors text-sm ${
                isActive
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`
            }
          >
            <link.icon className="h-4 w-4" />
            {link.name}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto text-zinc-500 text-xs">
        SONIC CITY - 2024
      </div>
    </aside>
  );
}