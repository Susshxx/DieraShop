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
const CART_KEY = "diera-cart";

// Helper to clear cart from localStorage
const clearCart = () => {
  localStorage.removeItem(CART_KEY);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setRole(null);
      clearCart(); // Clear cart if no token
      return;
    }
    try {
      const { user: u } = await authApi.me();
      setUser(u);
      setRole(u.role === "admin" ? "admin" : "user");
      
      // Clear cart if admin
      if (u.role === "admin") {
        clearCart();
      }
    } catch {
      clearToken();
      setUser(null);
      setRole(null);
      clearCart(); // Clear cart on error
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const setAuth = (token: string, u: ApiUser) => {
    setToken(token);
    setUser(u);
    setRole(u.role === "admin" ? "admin" : "user");
    
    // Clear cart if admin
    if (u.role === "admin") {
      clearCart();
      // Force reload to sync cart state
      window.dispatchEvent(new Event('storage'));
    }
  };

  const signOut = async () => {
    clearToken();
    setUser(null);
    setRole(null);
    clearCart(); // Clear cart on logout
    // Force reload to sync cart state
    window.dispatchEvent(new Event('storage'));
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
