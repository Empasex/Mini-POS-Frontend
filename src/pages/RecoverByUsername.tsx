import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { BASE_API_URL } from "../lib/api";

const baseURL = BASE_API_URL;

export default function RecoverByUsername() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`${baseURL}/auth/request_password_reset_by_username`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      if (!res.ok) {
        // try to extract message
        let detail = "Ocurrió un error";
        try {
          const j = await res.json();
          detail = j?.detail ?? j?.msg ?? detail;
        } catch {}
        setMsg(String(detail));
      } else {
        setMsg("Si la cuenta existe y tiene un email de recuperación, se enviará un link.");
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (err: any) {
      setMsg(err?.message ?? "Ocurrió un error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-yellow-400 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <h2 className="text-2xl font-bold text-yellow-600 mb-4">Recuperar contraseña</h2>
        <p className="text-sm text-gray-600 mb-4">
          Ingresa tu nombre de usuario. Si tiene un email de recuperación asociado, le enviaremos un enlace.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Nombre de usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />

          {msg && <div className="text-sm text-gray-700">{msg}</div>}

          <div className="flex gap-2 mt-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Enviando..." : "Enviar recuperación"}
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