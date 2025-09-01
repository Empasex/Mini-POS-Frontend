// ...existing code...
import React from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import RecoveryEmailModal from "../components/RecoveryEmailModal";

type AppLayoutProps = {
  children?: React.ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex">
      <Sidebar open={false} onClose={() => {}} />

      <div className="flex-1 ml-56">
        <Header />
        <main className="p-6">
          <RecoveryEmailModal />
          {/* Dev helper button: visible solo en entorno de desarrollo */}
          {import.meta.env.DEV ? (
            <div style={{ position: "fixed", right: 16, bottom: 16, zIndex: 60 }}>
              <button
                onClick={() => {
                  // @ts-ignore
                  if (typeof (window as any).forceShowRecoveryModal === "function") {
                    // @ts-ignore
                    (window as any).forceShowRecoveryModal();
                  } else {
                    sessionStorage.removeItem("recovery_prompted");
                    location.reload();
                  }
                }}
                className="px-3 py-2 rounded bg-indigo-600 text-white shadow"
                title="Forzar modal recovery (dev)"
              >
                Forzar modal (dev)
              </button>
            </div>
          ) : null}
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}
// ...existing code...