import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { authApi } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";

export default function VerifyRecoveryEmail() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [status, setStatus] = useState<string | null>(null);
  const auth = useAuth() as any;
  const navigate = useNavigate();

  useEffect(() => {
    const doVerify = async () => {
      try {
        await authApi.verifyRecoveryEmail(token);
        await auth.refreshUser();
        setStatus("verified");
        setTimeout(() => navigate("/"), 1400);
      } catch (err: any) {
        setStatus("error:" + (err?.response?.data?.detail ?? err?.message));
      }
    };
    if (token) doVerify();
    else setStatus("missing");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (status === null) return <div className="p-6">Verificando...</div>;
  if (status === "verified") return <div className="p-6">Correo verificado. Redirigiendo...</div>;
  return <div className="p-6 text-red-600">Error: {String(status)}</div>;
}