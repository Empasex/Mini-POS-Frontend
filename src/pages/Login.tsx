import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const auth = useAuth() as any;

  const ROLE_ALIAS_MAP: Record<string, string> = {
    ventas: "employee",
    inventario: "stock",
    administrador: "admin",
    employee: "employee",
    stock: "stock",
    admin: "admin",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const me = await auth.login(username, password);

      const raw = String(me?.role ?? auth.role ?? "").toLowerCase().trim();
      const canonical = ROLE_ALIAS_MAP[raw] ?? raw;
      const target = canonical === "employee" ? "/sales" : "/dashboard";

      if (auth.token) localStorage.setItem("token", auth.token);

      navigate(target);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? err?.message ?? "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-yellow-400 flex justify-center items-center py-12 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-10 flex flex-col items-center">
        <h2 className="text-3xl font-bold mb-6 text-yellow-600 text-center">POS Inteligente</h2>
        <p className="text-gray-500 text-center mb-8">Gestiona tu negocio de manera eficiente</p>

        <form className="w-full flex flex-col gap-4 mb-4" onSubmit={handleSubmit} autoComplete="on">
          <input
            name="username"
            autoComplete="username"
            type="text"
            placeholder="Usuario"
            className="border rounded px-3 py-3"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            name="password"
            autoComplete="current-password"
            type="password"
            placeholder="Contraseña"
            className="border rounded px-3 py-3"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <div className="text-sm text-red-600">{error}</div>}

          <button
            type="submit"
            className="bg-blue-600 text-white rounded py-3 font-semibold hover:bg-blue-700 transition disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="mt-3 text-center w-full">
          <Link to="/recover" className="text-sm text-blue-600 hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <p className="text-xs text-gray-400 text-center mt-2">Explora todas las funciones con tu cuenta</p>
      </div>
    </div>
  );
}