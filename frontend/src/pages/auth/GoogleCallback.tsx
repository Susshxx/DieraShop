import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { setToken } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const GoogleCallback = () => {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { setAuth } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = params.get("code");
    const errorParam = params.get("error");
    
    if (errorParam) {
      setError("Google sign-in was cancelled or failed");
      toast.error("Google sign-in failed");
      setTimeout(() => nav("/auth/login", { replace: true }), 2000);
      return;
    }
    
    if (!code) {
      setError("No authentication code received");
      toast.error("Authentication failed");
      setTimeout(() => nav("/auth/login", { replace: true }), 2000);
      return;
    }
    
    try {
      // Decode the auth code
      const decoded = JSON.parse(atob(code));
      const { token, user, redirect } = decoded;
      
      if (!token || !user) {
        throw new Error("Invalid auth data");
      }
      
      // Store the token and user
      setToken(token);
      setAuth(token, user);
      
      toast.success(`Welcome ${user.name || 'to Diera Shop'}!`);
      nav(redirect || '/account', { replace: true });
      
    } catch (error) {
      console.error("GoogleCallback - Decode error:", error);
      setError("Could not complete sign-in. Please try again.");
      toast.error("Authentication failed");
      setTimeout(() => nav("/auth/login", { replace: true }), 2000);
    }
  }, [params, nav, setAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md px-4">
        {!error ? (
          <>
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-lg text-foreground mb-2">Completing sign-in…</p>
            <p className="text-sm text-muted-foreground">Please wait while we verify your account</p>
          </>
        ) : (
          <>
            <div className="text-destructive mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-lg text-foreground mb-2">{error}</p>
            <p className="text-sm text-muted-foreground">Redirecting to login...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default GoogleCallback;
