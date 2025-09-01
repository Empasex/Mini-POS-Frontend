import React, { useState, useEffect } from "react";
import { authApi } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";

type Props = {
  open: boolean;
  initialEmail?: string | null;
  onClose: () => void;
  onSaved?: () => void;
};

export default function UpdateRecoveryEmailModal({ open, initialEmail, onClose, onSaved }: Props) {
  const auth = useAuth() as any;
  const [email, setEmail] = useState(initialEmail ?? "");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setEmail(initialEmail ?? "");
    setMsg(null);
  }, [initialEmail, open]);

  if (!open) return null;

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      await authApi.setRecoveryEmail({ email });
      // refresh local user state
      await auth.refreshUser?.();
      setMsg("Correo enviado. Revisa tu bandeja (o logs).");
      sessionStorage.setItem("recovery_prompted", "1");
      onSaved && onSaved();
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setMsg(err?.response?.data?.detail ?? "Error al enviar correo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded p-6 w-full max-w-md">
        <h3 className="text-lg font-bold mb-3">Editar email de recuperación</h3>
        <p className="text-sm text-gray-600 mb-3">Cambia el correo y presiona "Enviar correo" para reenviar el link de verificación.</p>

        <form onSubmit={handleSend} className="space-y-3">
          <input
            type="email"
            required
            placeholder="tu@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
          {msg && <div className="text-sm text-gray-700">{msg}</div>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-3 py-2 bg-gray-200 rounded">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="px-3 py-2 bg-blue-600 text-white rounded">
              {loading ? "Enviando..." : "Enviar correo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}