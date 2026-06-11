import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { setToken, authApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const GoogleCallback = () => {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { setAuth } = useAuth();

  useEffect(() => {
    const token = params.get("token");
    const redirect = params.get("redirect") || "/account";
    if (!token) {
      toast.error("Google sign-in failed");
      nav("/auth/login", { replace: true });
      return;
    }
    setToken(token);
    authApi
      .me()
      .then(({ user }) => {
        setAuth(token, user);
        toast.success("Welcome to Diera Shop!");
        nav(redirect, { replace: true });
      })
      .catch(() => {
        toast.error("Could not complete sign-in");
        nav("/auth/login", { replace: true });
      });
  }, [params, nav, setAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center text-muted-foreground">
      Completing sign-in…
    </div>
  );
};

export default GoogleCallback;
