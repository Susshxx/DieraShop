import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { authApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

const Login = () => {
  const nav = useNavigate();
  const loc = useLocation();
  const { setAuth } = useAuth();
  const from = (loc.state as { from?: { pathname: string } })?.from?.pathname || "/account";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { token, user } = await authApi.login(email, password);
      setAuth(token, user);
      toast.success("Welcome back!");
      nav(from, { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = () => {
    window.location.href = authApi.googleUrl(from);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-card border border-border rounded-lg p-8 shadow-sm">
        <h1 className="text-3xl mb-2">Welcome to Diera Shop</h1>
        <p className="text-sm text-muted-foreground mb-6">Sign in to continue shopping.</p>

        <Button onClick={handleGoogle} variant="outline" className="w-full mb-4">
          Continue with Google
        </Button>

        <div className="relative my-4 text-center text-xs text-muted-foreground">
          <span className="bg-card px-2 relative z-10">or</span>
          <span className="absolute left-0 right-0 top-1/2 h-px bg-border" />
        </div>

        <form onSubmit={handleEmail} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input 
                id="password" 
                type={showPassword ? "text" : "password"} 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <div className="mt-6 text-sm text-center space-y-2">
          <Link to="/auth/reset" className="text-primary hover:underline">Forgot password?</Link>
          <div className="text-muted-foreground">
            New here? <Link to="/auth/signup" className="text-primary hover:underline">Create an account</Link>
          </div>
          <div className="text-xs text-muted-foreground pt-4 border-t border-border">
            <Link to="/admin/login" className="hover:underline">Admin login →</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
