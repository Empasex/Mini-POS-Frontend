// ...existing code...
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { authApi } from "../lib/api";

export default function RecoveryEmailModal() {
  const auth = useAuth() as any;
  const user = auth.user;
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(user?.recovery_email ?? "");
  const [loading, setLoading] = useState(false);
  const [sentInfo, setSentInfo] = useState<string | null>(null);

  const prevPromptedRef = useRef<string | null>(null);

  useEffect(() => {
    const promptedRaw = sessionStorage.getItem("recovery_prompted");
    const prompted = promptedRaw === "1";
    const hasRecoveryEmail = Boolean(user?.recovery_email);
    const needs = Boolean(user && (!user.recovery_email || !user.recovery_verified));

    // opción: ignorar "recordarme" si el usuario NO tiene ningún recovery_email
    const ignorePromptedIfNoEmail = true;
    const shouldShow = needs && (!prompted || (ignorePromptedIfNoEmail && !hasRecoveryEmail));

    if (prevPromptedRef.current !== promptedRaw) {
      // eslint-disable-next-line no-console
      console.log("RecoveryEmailModal check:", { user, prompted: promptedRaw, needs, hasRecoveryEmail, shouldShow });
      prevPromptedRef.current = promptedRaw;
    }

    setEmail(user?.recovery_email ?? "");
    setOpen((current) => (current === shouldShow ? current : shouldShow));

    // helper global para pruebas: forzar mostrar el modal desde la consola
    // uso: window.forceShowRecoveryModal()
    // @ts-ignore
    (window as any).forceShowRecoveryModal = () => {
      sessionStorage.removeItem("recovery_prompted");
      setOpen(true);
    };

    return () => {
      // @ts-ignore
      delete (window as any).forceShowRecoveryModal;
    };
  }, [user]);

  if (!open) return null;

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    try {
      await authApi.setRecoveryEmail({ email });
      await auth.refreshUser();
      setSentInfo("Se envió un correo de verificación. Revisa tu bandeja.");
      sessionStorage.setItem("recovery_prompted", "1");
      setTimeout(() => setOpen(false), 1200);
    } catch (err: any) {
      alert(err?.response?.data?.detail ?? "Error guardando email");
    } finally {
      setLoading(false);
    }
  };

  const handleLater = () => {
    sessionStorage.setItem("recovery_prompted", "1");
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded p-6 w-full max-w-md">
        <h3 className="text-lg font-bold mb-3">Agrega un email de recuperación</h3>
        <p className="text-sm text-gray-600 mb-3">Esto permitirá recuperar tu cuenta si olvidas la contraseña.</p>

        <form onSubmit={handleSave} className="space-y-3">
          <input
            type="email"
            required
            placeholder="tu@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
          {sentInfo && <div className="text-sm text-green-600">{sentInfo}</div>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={handleLater} className="px-3 py-2 bg-gray-200 rounded">
              Recordarme más tarde
            </button>
            <button type="submit" disabled={loading} className="px-3 py-2 bg-blue-600 text-white rounded">
              {loading ? "Guardando..." : "Guardar y enviar verificación"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
// ...existing code...