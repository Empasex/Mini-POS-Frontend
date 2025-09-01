// ...existing code...
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Boxes, ShoppingCart, BarChart2, Lightbulb, X, Archive, Users } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const navItems = [
  { to: "/dashboard", label: "Panel de control", icon: LayoutDashboard },
  { to: "/inventory", label: "Inventario", icon: Boxes },
  { to: "/sales", label: "Ventas", icon: ShoppingCart },
  { to: "/reports", label: "Reportes", icon: BarChart2 },
  { to: "/admin/users", label: "Usuarios", icon: Users }, // añadido
  { to: "/archive", label: "Archivos/Ventas", icon: Archive }, // añadido
  { to: "/insights", label: "Perspectivas", icon: Lightbulb },
];

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { role } = useAuth();

  const itemsFiltered = navItems.filter((item) => {
    if (item.to === "/inventory") return role === "admin" || role === "stock";
    if (item.to === "/reports" || item.to === "/archive") return role === "admin";
    if (item.to === "/dashboard") return role === "admin" || role === "stock";
    if (item.to === "/sales") return role === "admin" || role === "stock" || role === "employee";
    if (item.to === "/admin/users") return role === "admin"; // mostrar solo a admin
    return true;
  });

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col bg-gray-100 border-r w-56 min-h-screen px-4 py-6 fixed left-0 top-0 z-40">
        <nav className="flex flex-col gap-2 mt-8">
          {itemsFiltered.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md border-l-4 transition ${
                  isActive
                    ? "bg-white border-blue-600 font-semibold text-blue-600"
                    : "border-transparent text-gray-700 hover:bg-white"
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-50 bg-black bg-opacity-30 md:hidden transition ${
          open ? "block" : "hidden"
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed top-0 left-0 z-50 bg-gray-100 border-r w-56 min-h-screen px-4 py-6 flex flex-col md:hidden transition-transform ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          onClick={onClose}
          aria-label="Cerrar menú"
        >
          <X className="w-6 h-6" />
        </button>
        <nav className="flex flex-col gap-2 mt-8">
          {itemsFiltered.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md border-l-4 transition ${
                  isActive
                    ? "bg-white border-blue-600 font-semibold text-blue-600"
                    : "border-transparent text-gray-700 hover:bg-white"
                }`
              }
              onClick={onClose}
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}