import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";

type User = any;

type AuthState = {
  token: string | null;
  username: string | null;
  role: string | null;
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<User | null>;
  logout: () => void;
  refreshUser: () => Promise<User | null>;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem("username"));
  const [role, setRole] = useState<string | null>(() => localStorage.getItem("role"));
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const applyTokenHeader = (t: string | null) => {
    if (t) {
      api.defaults.headers.common["Authorization"] = `Bearer ${t}`;
      localStorage.setItem("token", t);
    } else {
      delete api.defaults.headers.common["Authorization"];
      localStorage.removeItem("token");
    }
  };

  const fetchMe = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/auth/me");
      const data = res.data ?? res;
      setUser(data ?? null);
      if (data?.username) setUsername(data.username);
      if (data?.role) setRole(data.role);
      if (data?.role) localStorage.setItem("role", data.role);
      if (data?.username) localStorage.setItem("username", data.username);
      return data ?? null;
    } catch (err) {
      setUser(null);
      setRole(null);
      setUsername(null);
      localStorage.removeItem("role");
      localStorage.removeItem("username");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      applyTokenHeader(token);
      if (!user) {
        fetchMe().catch(() => {});
      }
    } else {
      applyTokenHeader(null);
      setUser(null);
      setRole(null);
      setUsername(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const login = async (usernameIn: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.post("/auth/login", { username: usernameIn, password });
      const data = res.data ?? res;
      const access_token = data?.access_token ?? data?.token ?? null;
      const r = data?.role ?? null;

      if (!access_token) throw new Error("No access token returned");

      setToken(access_token);
      applyTokenHeader(access_token);

      if (r) {
        setRole(r);
        localStorage.setItem("role", r);
      }
      setUsername(usernameIn);
      localStorage.setItem("username", usernameIn);

      const me = await fetchMe();
      return me;
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    return fetchMe();
  };

  const logout = () => {
    setToken(null);
    setUsername(null);
    setRole(null);
    setUser(null);
    setIsLoading(false);
    applyTokenHeader(null);
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    navigate("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        username,
        role,
        user,
        isLoading,
        login,
        logout,
        refreshUser,
        isAuthenticated: Boolean(token),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}