export type RoleKey = "admin" | "stock" | "employee";

export const ROLE_LABELS: Record<RoleKey | string, string> = {
  admin: "Administrador",
  stock: "Inventario",
  employee: "Ventas",
};

export const ROLE_OPTIONS: { value: RoleKey; label: string }[] = [
  { value: "admin", label: ROLE_LABELS.admin },
  { value: "stock", label: ROLE_LABELS.stock },
  { value: "employee", label: ROLE_LABELS.employee },
];