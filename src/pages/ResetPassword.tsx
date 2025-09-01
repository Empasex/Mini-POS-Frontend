import React, { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";

const baseURL = (import.meta.env.VITE_API_URL as string) ?? "http://localhost:8000/api";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const tokenFromQuery = params.get("token") ?? "";

  const [token, setToken] = useState(tokenFromQuery);
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setToken(tokenFromQuery);
  }, [tokenFromQuery]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    setMsg(null);

    if (!token) {
      setError("Token faltante en la URL.");
      return;
    }
    if (newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${baseURL}/auth/perform_password_reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: newPassword }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(j?.detail ?? j?.msg ?? "Error al restablecer la contraseña");
        return;
      }
      setMsg("Contraseña restablecida correctamente. Redirigiendo al login...");
      setTimeout(() => navigate("/login"), 1600);
    } catch (err: any) {
      setError(err?.message ?? "Error de red");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-yellow-400 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <h2 className="text-2xl font-bold text-yellow-600 mb-4">Restablecer contraseña</h2>
        <p className="text-sm text-gray-600 mb-4">
          Ingresa una nueva contraseña. El enlace expira en un tiempo limitado.
        </p>

        {!token ? (
          <div className="text-sm text-red-600 mb-4">
            Token no encontrado en la URL. Verifica el enlace o solicita uno nuevo en{" "}
            <Link to="/recover" className="text-blue-600 underline">Recuperar contraseña</Link>.
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            name="new_password"
            autoComplete="new-password"
            type="password"
            placeholder="Nueva contraseña"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            required
          />

          <input
            name="confirm_password"
            autoComplete="new-password"
            type="password"
            placeholder="Confirmar nueva contraseña"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            required
          />

          {error && <div className="text-sm text-red-600">{error}</div>}
          {msg && <div className="text-sm text-green-600">{msg}</div>}

          <div className="flex gap-2 mt-2">
            <button
              type="submit"
              disabled={loading || !token}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Procesando..." : "Restablecer contraseña"}
            </button>

            <Link to="/login" className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-800 rounded border hover:bg-gray-200">
              Volver
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}