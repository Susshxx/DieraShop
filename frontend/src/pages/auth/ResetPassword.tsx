import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ResetPassword = () => {
  const [email, setEmail] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.info("Password reset via email will be available once SMTP is configured.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-card border border-border rounded-lg p-8 shadow-sm">
        <h1 className="text-2xl mb-4">Reset password</h1>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full">Send reset link</Button>
        </form>
        <p className="mt-4 text-sm text-center">
          <Link to="/auth/login" className="text-primary hover:underline">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
