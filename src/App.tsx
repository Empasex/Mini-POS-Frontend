// ...existing code...
import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Sales from "./pages/Sales";
import Reports from "./pages/Reports";
import Archive from "./pages/Archive";
import Insights from "./pages/Insights";
import Login from "./pages/Login";
import AdminUsers from "./pages/AdminUsers";
import VerifyRecoveryEmail from "./pages/VerifyRecoveryEmail";
import RecoverByUsername from "./pages/RecoverByUsername";
import ResetPassword from "./pages/ResetPassword";

import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />

          <Route
            path="dashboard"
            element={
              <ProtectedRoute allowed={["admin", "stock"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="inventory"
            element={
              <ProtectedRoute allowed={["admin", "stock"]}>
                <Inventory />
              </ProtectedRoute>
            }
          />

          <Route
            path="sales"
            element={
              <ProtectedRoute allowed={["admin", "stock", "employee"]}>
                <Sales />
              </ProtectedRoute>
            }
          />

          <Route
            path="reports"
            element={
              <ProtectedRoute allowed={["admin"]}>
                <Reports />
              </ProtectedRoute>
            }
          />

          <Route
            path="admin/users"
            element={
              <ProtectedRoute allowed={["admin"]}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />

          <Route
            path="archive"
            element={
              <ProtectedRoute allowed={["admin"]}>
                <Archive />
              </ProtectedRoute>
            }
          />

          <Route path="insights" element={<Insights />} />
        </Route>

        <Route path="/recover" element={<RecoverByUsername />} />
        <Route path="/verify-recovery" element={<VerifyRecoveryEmail />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}
// ...existing code...