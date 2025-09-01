import { type ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ROLE_ALIAS_MAP: Record<string, string> = {
  ventas: "employee",
  inventario: "stock",
  administrador: "admin",
  employee: "employee",
  stock: "stock",
  admin: "admin",
};

export default function ProtectedRoute({
  children,
  allowed,
  allowedRoles,
}: {
  children: ReactElement;
  allowed?: string[];
  allowedRoles?: string[];
}) {
  const auth = useAuth();

  // esperar mientras se carga el user
  if (auth.isLoading) return null;

  // no autenticado -> login
  if (!auth.isAuthenticated) return <Navigate to="/login" replace />;

  // token presente pero user aún no poblado -> esperar (evita redirect prematuro)
  if (auth.isAuthenticated && !auth.user) return null;

  const permitted = allowed ?? allowedRoles;
  if (!permitted) return children;

  const allowedNorm = new Set(permitted.map((r) => String(r).toLowerCase().trim()));
  const rawRole = String(auth.user?.role ?? auth.role ?? "").toLowerCase().trim();
  const canonical = ROLE_ALIAS_MAP[rawRole] ?? rawRole;
  const roleVariants = [rawRole, canonical];

  const ok = roleVariants.some((r) => allowedNorm.has(r));
  if (!ok) {
    // excepción necesaria para tu caso: empleados visuales ("ventas"/"employee")
    if (canonical === "employee" || rawRole === "ventas" || rawRole.includes("ventas")) {
      return <Navigate to="/sales" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}