import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState({ full_name: "", phone: "", address: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.get<{ full_name: string; phone: string; address: string }>("/users/profile")
      .then((data) => setProfile({ full_name: data.full_name || "", phone: data.phone || "", address: data.address || "" }))
      .catch(() => {});
  }, [user]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    try {
      await api.patch("/users/profile", profile);
      toast.success("Profile saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-4 max-w-lg">
      <div><Label>Email</Label><Input value={user?.email || ""} disabled /></div>
      <div><Label htmlFor="fn">Full name</Label><Input id="fn" value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} /></div>
      <div><Label htmlFor="ph">Phone</Label><Input id="ph" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></div>
      <div><Label htmlFor="ad">Default shipping address</Label><Input id="ad" value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} /></div>
      <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
    </form>
  );
};

export default Profile;
