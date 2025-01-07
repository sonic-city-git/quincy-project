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
    <div className="w-64 min-h-screen bg-zinc-900 p-4 flex flex-col border-r border-zinc-800">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-amber-600">QUINCY</h1>
      </div>
      <nav className="space-y-2">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded-md transition-colors ${
                isActive
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`
            }
          >
            <link.icon className="h-5 w-5" />
            {link.name}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto text-zinc-500 text-sm">
        SONIC CITY - 2024
      </div>
    </div>
  );
}