import { useState } from "react";
import { Menu } from "lucide-react";

import { useAuth } from "../contexts/AuthContext";
import { ROLE_LABELS } from "../lib/roles";
import UpdateRecoveryEmailModal from "./UpdateRecoveryEmailModal";

export default function Header({
  onMenu,
}: {
  onMenu?: () => void;
}) {
  const auth = useAuth() as any;
  const { username, role, logout } = auth;

  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const displayName = username || (role && ROLE_LABELS?.[role]) || role || "-";
  const displayRole = (role && ROLE_LABELS?.[role]) || role || "-";

  const handleOpenUpdate = () => {
    setShowUpdateModal(true);
  };

  const handleCloseUpdate = () => setShowUpdateModal(false);

  return (
    <>
      <header className="px-6 py-4 flex items-center justify-between sticky top-0 z-30 bg-transparent">
        <div className="flex items-center gap-3">
          {onMenu && (
            <button
              className="md:hidden text-gray-600 hover:text-blue-600 mr-2"
              onClick={onMenu}
              aria-label="Abrir menú"
            >
              <Menu className="w-7 h-7" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {(username || role) ? (
            <>
              <button
                type="button"
                className="px-3 py-1 bg-gray-100 border border-gray-200 rounded text-sm text-gray-700 hover:bg-gray-50"
                title="Usuario"
                aria-label="Usuario"
              >
                {displayName}
              </button>

              <button
                type="button"
                className="px-2 py-1 bg-blue-50 border border-blue-100 rounded text-xs text-blue-700 hover:bg-blue-100"
                title="Rol"
                aria-label="Rol"
              >
                {displayRole}
              </button>

              {auth?.user ? (
                auth.user.recovery_email ? (
                  auth.user.recovery_verified ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">Verificado</span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">Por verificar</span>

                      {/* Editar email (abre modal) */}
                      <button
                        onClick={handleOpenUpdate}
                        className="ml-1 px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs border border-gray-200"
                        title="Editar email de recuperación"
                      >
                        Editar
                      </button>
                    </span>
                  )
                ) : (
                  <span className="px-2 py-1 bg-gray-200 rounded text-sm">Sin email</span>
                )
              ) : null}

              <button
                type="button"
                onClick={logout}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                aria-label="Cerrar sesión"
              >
                Cerrar sesión
              </button>
            </>
          ) : null}
        </div>
      </header>

      <UpdateRecoveryEmailModal
        open={showUpdateModal}
        initialEmail={auth?.user?.recovery_email}
        onClose={handleCloseUpdate}
        onSaved={async () => {
          await auth.refreshUser?.();
          handleCloseUpdate();
        }}
      />
    </>
  );
}
// ...existing code...