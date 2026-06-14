import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { ApiUser, authApi, clearToken, getToken, setToken } from "@/lib/api";

type Role = "admin" | "user" | null;

interface AuthCtx {
  user: ApiUser | null;
  role: Role;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setAuth: (token: string, user: ApiUser) => void;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setRole(null);
      return;
    }
    try {
      const { user: u } = await authApi.me();
      setUser(u);
      setRole(u.role === "admin" ? "admin" : "user");
    } catch {
      clearToken();
      setUser(null);
      setRole(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const setAuth = (token: string, u: ApiUser) => {
    setToken(token);
    setUser(u);
    setRole(u.role === "admin" ? "admin" : "user");
  };

  const signOut = async () => {
    // clearToken is synchronous (localStorage) — token is gone before any re-render
    clearToken();
    setUser(null);
    setRole(null);
  };

  return (
    <Ctx.Provider value={{ user, role, loading, signOut, refreshUser, setAuth }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be inside AuthProvider");
  return v;
};

export const useRole = () => useAuth().role;
