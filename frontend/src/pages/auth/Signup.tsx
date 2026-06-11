import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { z } from "zod";

const schema = z.object({
  fullName: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
});

const Signup = () => {
  const nav = useNavigate();
  const { setAuth } = useAuth();
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"form" | "otp">("form");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setBusy(true);
    try {
      const result = await authApi.sendOtp(form.email, form.fullName, form.password);
      setStep("otp");
      toast.success(
        result.devOtpLogged
          ? "Code generated — check the backend terminal for your OTP"
          : "Verification code sent to your email"
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error("Enter the 6-digit code");
    setBusy(true);
    try {
      const { token, user } = await authApi.verifyOtp(form.email, otp);
      setAuth(token, user);
      toast.success("Account created — welcome to Diera Shop!");
      nav("/account", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = () => {
    window.location.href = authApi.googleUrl("/account");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md bg-card border border-border rounded-lg p-8 shadow-sm">
        <h1 className="text-3xl mb-2">Create your account</h1>
        <p className="text-sm text-muted-foreground mb-6">Shop, save favorites, and track orders.</p>

        {step === "form" ? (
          <>
            <Button onClick={handleGoogle} variant="outline" className="w-full mb-4">Continue with Google</Button>

            <div className="relative my-4 text-center text-xs text-muted-foreground">
              <span className="bg-card px-2 relative z-10">or</span>
              <span className="absolute left-0 right-0 top-1/2 h-px bg-border" />
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                <p className="text-xs text-muted-foreground mt-1">At least 8 characters.</p>
              </div>
              <Button type="submit" className="w-full" disabled={busy}>{busy ? "Sending code…" : "Continue"}</Button>
            </form>
          </>
        ) : (
          <form onSubmit={verifyOtp} className="space-y-4">
            <p className="text-sm text-muted-foreground">Enter the 6-digit code sent to {form.email}</p>
            <div>
              <Label htmlFor="otp">Verification code</Label>
              <Input id="otp" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} required />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>{busy ? "Verifying…" : "Verify & create account"}</Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => setStep("form")}>Back</Button>
          </form>
        )}

        <p className="mt-6 text-sm text-center text-muted-foreground">
          Already have an account? <Link to="/auth/login" className="text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
