import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { setToken, authApi, api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const GoogleCallback = () => {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { setAuth } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const status = params.get("status");
    
    console.log("GoogleCallback - status:", status);
    
    if (status !== "success") {
      console.error("GoogleCallback - Invalid status");
      setError("Google sign-in was not completed successfully");
      toast.error("Google sign-in failed");
      setTimeout(() => nav("/auth/login", { replace: true }), 2000);
      return;
    }
    
    console.log("GoogleCallback - Fetching auth from cookie");
    
    // Get token and user data from cookie
    api.get("/auth/cookie-auth")
      .then((response) => {
        console.log("GoogleCallback - Cookie auth successful:", response);
        const { token, user } = response;
        
        // Get redirect from cookie or default
        const getCookie = (name: string) => {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop()?.split(';').shift();
          return null;
        };
        
        const redirect = getCookie('auth_redirect') || '/account';
        
        setToken(token);
        setAuth(token, user);
        toast.success(`Welcome ${user.name || 'to Diera Shop'}!`);
        
        // Clear the redirect cookie
        document.cookie = 'auth_redirect=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        
        nav(redirect, { replace: true });
      })
      .catch((error) => {
        console.error("GoogleCallback - Cookie auth error:", error);
        setError("Could not complete sign-in. Please try again.");
        toast.error("Authentication failed");
        setTimeout(() => nav("/auth/login", { replace: true }), 2000);
      });
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
