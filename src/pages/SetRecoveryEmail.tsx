import React, { useState } from "react";
import api from "../lib/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function SetRecoveryEmail() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth() as any;
  const navigate = useNavigate();

  React.useEffect(() => {
    // si ya tiene email, no debería estar aquí
    if (user?.recovery_email) navigate("/");
  }, [user, navigate]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/set_recovery_email", { email });
      alert("Email de recuperación guardado.");
      navigate("/");
    } catch (err: any) {
      alert(err?.response?.data?.detail ?? "Error guardando email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-lg font-semibold mb-4">Registrar email de recuperación</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          required
          placeholder="tu@ejemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded" disabled={loading}>
            Guardar
          </button>
          <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 bg-gray-200 rounded">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}