import React, { useEffect, useState } from "react";
import api from "../lib/api";
import { ROLE_LABELS, ROLE_OPTIONS } from "../lib/roles.ts";
import { useAuth } from "../contexts/AuthContext";

type UserItem = {
  id: number;
  username: string;
  role: string;
  is_active: boolean;
};

export default function AdminUsers() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showTemp, setShowTemp] = useState<{ username: string; password: string } | null>(null);

  const [creating, setCreating] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newRole, setNewRole] = useState("employee");
  const [newPassword, setNewPassword] = useState<string | undefined>(undefined);

  // obtener usuario actual para evitar acciones sobre sí mismo
  const { username: meUsername } = useAuth() as any;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/admin/users/");
      setUsers(res.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newUsername) {
      alert("Ingresa un nombre de usuario");
      return;
    }
    try {
      const payload: any = { username: newUsername, role: newRole };
      if (newPassword && newPassword.length > 0) payload.password = newPassword;
      const res = await api.post("/admin/users/", payload);
      const temp = res.data?.temp_password;
      if (temp) setShowTemp({ username: res.data.username, password: temp });
      setCreating(false);
      setNewUsername("");
      setNewRole("employee");
      setNewPassword(undefined);
      fetchUsers();
    } catch (err: any) {
      alert(err?.response?.data?.detail ?? "Error al crear usuario");
    }
  };

  const handleReset = async (id: number, username: string) => {
    if (!confirm(`Resetear contraseña de "${username}"? Se mostrará una contraseña temporal UNA sola vez.`)) return;
    try {
      const res = await api.post(`/admin/users/${id}/reset`);
      const temp = res.data?.temp_password;
      if (temp) setShowTemp({ username, password: temp });
      else alert("Contraseña reseteada (no se devolvió temp).");
      fetchUsers();
    } catch (err: any) {
      alert(err?.response?.data?.detail ?? "Error al resetear contraseña");
    }
  };

  const handleToggleActive = async (id: number, current: boolean, username: string) => {
    if (username === meUsername) {
      alert("No puedes desactivar/activar tu propia cuenta desde aquí.");
      return;
    }
    try {
      await api.put(`/admin/users/${id}`, { is_active: !current });
      fetchUsers();
    } catch (err: any) {
      alert(err?.response?.data?.detail ?? "Error al actualizar usuario");
    }
  };

  // Cambiado: si el usuario cancela, NO hacer soft-delete. Cancelar = no hacer nada.
  const handleDelete = async (id: number, username: string) => {
    if (username === meUsername) {
      alert("No puedes eliminar tu propia cuenta.");
      return;
    }

    const confirmed = confirm(
      `¿Eliminar permanentemente al usuario "${username}"?\n\nAceptar = Eliminar permanentemente.\nCancelar = NO hacer cambios.`
    );
    if (!confirmed) {
      // Usuario canceló: no hacer nada
      return;
    }

    try {
      await api.delete(`/admin/users/${id}?hard=true`);
      fetchUsers();
    } catch (err: any) {
      alert(err?.response?.data?.detail ?? "Error al eliminar usuario");
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Administrar usuarios</h1>
          <div>
            <button
              onClick={() => setCreating((v) => !v)}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
            >
              {creating ? "Cancelar" : "Crear usuario"}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5">
          {creating && (
            <form onSubmit={handleCreate} className="mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <input
                  className="border px-3 py-2 rounded"
                  placeholder="Usuario"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                />
                <select
                  className="border px-3 py-2 rounded"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <input
                  className="border px-3 py-2 rounded"
                  placeholder="Contraseña (opcional)"
                  value={newPassword ?? ""}
                  onChange={(e) => setNewPassword(e.target.value || undefined)}
                  type="password"
                />
                <div className="col-span-3 flex justify-end mt-2">
                  <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded">
                    Crear
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3">Usuario</th>
                  <th className="text-left px-4 py-3">Rol</th>
                  <th className="text-left px-4 py-3">Activo</th>
                  <th className="text-left px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center">
                      Cargando...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center">
                      No hay usuarios
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="border-t">
                      <td className="px-4 py-3">{u.username}</td>
                      <td className="px-4 py-3">{ROLE_LABELS[u.role] ?? u.role}</td>
                      <td className="px-4 py-3">{u.is_active ? "Sí" : "No"}</td>
                      <td className="px-4 py-3 flex gap-2">
                        <button
                          onClick={() => handleReset(u.id, u.username)}
                          className="px-2 py-1 bg-yellow-400 rounded text-sm"
                        >
                          Reset
                        </button>
                        <button
                          onClick={() => handleToggleActive(u.id, u.is_active, u.username)}
                          className="px-2 py-1 bg-gray-200 rounded text-sm"
                          disabled={u.username === meUsername}
                          title={u.username === meUsername ? "No puedes cambiar tu propio estado desde aquí" : "Activar/Desactivar usuario"}
                        >
                          {u.is_active ? "Desactivar" : "Activar"}
                        </button>
                        <button
                          onClick={() => handleDelete(u.id, u.username)}
                          className="px-2 py-1 bg-red-600 text-white rounded text-sm"
                          disabled={u.username === meUsername}
                          title={u.username === meUsername ? "No puedes eliminar tu propia cuenta" : "Eliminar usuario"}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {error && <div className="mt-4 text-red-600">{error}</div>}
        </div>

        {showTemp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded shadow-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-2">Contraseña temporal</h3>
              <p className="mb-3">
                Usuario: <strong>{showTemp.username}</strong>
              </p>
              <div className="mb-4">
                <input className="w-full border px-3 py-2 rounded" readOnly value={showTemp.password} />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(showTemp.password);
                    alert("Contraseña copiada");
                  }}
                  className="px-3 py-1 bg-blue-600 text-white rounded"
                >
                  Copiar
                </button>
                <button onClick={() => setShowTemp(null)} className="px-3 py-1 bg-gray-200 rounded">
                  Cerrar
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                La contraseña solo se muestra una vez. Pide al usuario cambiarla al iniciar sesión.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}