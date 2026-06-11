import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";

const AdminSignup = () => {
  const nav = useNavigate();
  const { setAuth } = useAuth();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", code: "" });
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { token, user } = await authApi.adminSignup({
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        adminSignupCode: form.code,
      });
      setAuth(token, user);
      toast.success("Admin account created");
      nav("/admin", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md bg-card border border-border rounded-lg p-8">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="w-5 h-5 text-primary" />
          <h1 className="text-2xl">Create Admin Account</h1>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="fn">Full name</Label>
            <Input id="fn" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="em">Email</Label>
            <Input id="em" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="pw">Password</Label>
            <Input id="pw" type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="cd">Admin signup code</Label>
            <Input id="cd" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Provided by Diera owner" />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>{busy ? "Creating…" : "Create admin account"}</Button>
        </form>
        <p className="mt-6 text-sm text-center text-muted-foreground">
          Already an admin? <Link to="/admin/login" className="text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default AdminSignup;
