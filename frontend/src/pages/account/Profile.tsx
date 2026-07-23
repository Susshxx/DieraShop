import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Camera, MapPin, Loader2, AlertCircle, User } from "lucide-react";

// ─── Nepal provinces & districts ─────────────────────────────────────────────
const NEPAL_DATA: Record<string, string[]> = {
  "Koshi Province": [
    "Bhojpur","Dhankuta","Ilam","Jhapa","Khotang","Morang","Okhaldhunga",
    "Panchthar","Sankhuwasabha","Solukhumbu","Sunsari","Taplejung","Terhathum","Udayapur",
  ],
  "Madhesh Province": [
    "Bara","Dhanusha","Mahottari","Parsa","Rautahat","Saptari","Sarlahi","Siraha",
  ],
  "Bagmati Province": [
    "Bhaktapur","Chitwan","Dhading","Dolakha","Kathmandu","Kavrepalanchok",
    "Lalitpur","Makwanpur","Nuwakot","Ramechhap","Rasuwa","Sindhuli","Sindhupalchok",
  ],
  "Gandaki Province": [
    "Baglung","Gorkha","Kaski","Lamjung","Manang","Mustang","Myagdi",
    "Nawalpur","Parbat","Syangja","Tanahu",
  ],
  "Lumbini Province": [
    "Arghakhanchi","Banke","Bardiya","Dang","East Rukum","Gulmi","Kapilvastu",
    "Nawalparasi (West)","Palpa","Pyuthan","Rolpa","Rupandehi",
  ],
  "Karnali Province": [
    "Dailekh","Dolpa","Humla","Jajarkot","Jumla","Kalikot","Mugu",
    "Salyan","Surkhet","West Rukum",
  ],
  "Sudurpashchim Province": [
    "Achham","Baitadi","Bajhang","Bajura","Dadeldhura","Darchula","Doti",
    "Kailali","Kanchanpur",
  ],
};

interface ProfileData {
  full_name: string;
  phone: string;
  address: string;
  province: string;
  district: string;
  avatar_url: string;
}

const Profile = () => {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = "My Profile - Diera Shop | Account Settings";
  }, []);

  const [profile, setProfile] = useState<ProfileData>({
    full_name: "",
    phone: "",
    address: "",
    province: "",
    district: "",
    avatar_url: "",
  });
  const [busy, setBusy] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [locBusy, setLocBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  
  // Derived
  const districts = profile.province ? NEPAL_DATA[profile.province] ?? [] : [];

  /* ── Load profile ── */
  useEffect(() => {
    if (!user) return;
    api
      .get<ProfileData>("/users/profile")
      .then((data) =>
        setProfile({
          full_name: data.full_name || "",
          phone: data.phone || "",
          address: data.address || "",
          province: data.province || "",
          district: data.district || "",
          avatar_url: data.avatar_url || "",
        })
      )
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [user]);

  /* ── Save profile ── */
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    try {
      await api.patch("/users/profile", {
        full_name: profile.full_name,
        phone: profile.phone,
        address: profile.address,
        province: profile.province,
        district: profile.district,
      });
      toast.success("Profile saved!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  /* ── Avatar upload ── */
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }
    setAvatarBusy(true);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      const res = await api.post<{ avatar_url: string }>("/users/profile/avatar", fd);
      setProfile((p) => ({ ...p, avatar_url: res.avatar_url }));
      toast.success("Photo updated!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setAvatarBusy(false);
    }
  };

  /* ── Live location ── */
  const useLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setLocBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          // Reverse geocode using OpenStreetMap Nominatim (free, no key needed)
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`
          );
          const data = await res.json();
          
          // Extract address components
          const address = data.address || {};
          
          // Extract district (county, state_district, or city)
          const detectedDistrict = address.county || address.state_district || address.city || address.town || address.village || "";
          
          // Extract province/state
          const detectedProvince = address.state || "";
          
          // Extract street/locality for address field
          const streetParts = [
            address.road,
            address.suburb,
            address.neighbourhood,
            address.hamlet,
          ].filter(Boolean);
          
          const streetAddress = streetParts.length > 0 
            ? streetParts.join(", ")
            : address.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          
          // Match detected province with our Nepal provinces
          let matchedProvince = "";
          let matchedDistrict = "";
          
          if (detectedProvince) {
            // Try to find matching province in NEPAL_DATA (case-insensitive partial match)
            const provinceKey = Object.keys(NEPAL_DATA).find(prov => 
              prov.toLowerCase().includes(detectedProvince.toLowerCase()) ||
              detectedProvince.toLowerCase().includes(prov.toLowerCase().split(' ')[0])
            );
            
            if (provinceKey) {
              matchedProvince = provinceKey;
              
              // Now match district within this province
              if (detectedDistrict) {
                const districtMatch = NEPAL_DATA[provinceKey].find(dist =>
                  dist.toLowerCase() === detectedDistrict.toLowerCase() ||
                  detectedDistrict.toLowerCase().includes(dist.toLowerCase()) ||
                  dist.toLowerCase().includes(detectedDistrict.toLowerCase())
                );
                
                if (districtMatch) {
                  matchedDistrict = districtMatch;
                }
              }
            }
          }
          
          // If province not matched, try to match district across all provinces
          if (!matchedProvince && detectedDistrict) {
            for (const [prov, districts] of Object.entries(NEPAL_DATA)) {
              const districtMatch = districts.find(dist =>
                dist.toLowerCase() === detectedDistrict.toLowerCase() ||
                detectedDistrict.toLowerCase().includes(dist.toLowerCase()) ||
                dist.toLowerCase().includes(detectedDistrict.toLowerCase())
              );
              
              if (districtMatch) {
                matchedProvince = prov;
                matchedDistrict = districtMatch;
                break;
              }
            }
          }
          
          // Update profile with extracted data
          setProfile((p) => ({
            ...p,
            address: streetAddress,
            province: matchedProvince || p.province,
            district: matchedDistrict || p.district,
          }));
          
          if (matchedProvince && matchedDistrict) {
            toast.success(`Location detected: ${matchedDistrict}, ${matchedProvince}`);
          } else if (matchedProvince || matchedDistrict) {
            toast.success("Location detected! Please verify province and district.");
          } else {
            toast.success("Address detected! Please select province and district manually.");
          }
        } catch (err) {
          console.error("Geolocation error:", err);
          toast.error("Could not get address from location");
        } finally {
          setLocBusy(false);
        }
      },
      () => {
        toast.error("Location access denied");
        setLocBusy(false);
      }
    );
  };

  /* ── Missing fields banner ── */
  const missing: string[] = [];
  if (loaded) {
    if (!profile.full_name) missing.push("Full Name");
    if (!profile.phone) missing.push("Phone Number");
    if (!profile.address) missing.push("Shipping Address");
  }

  return (
    <div className="max-w-2xl">
      {/* Incomplete profile warning */}
      {missing.length > 0 && (
        <div className="mb-6 flex items-start gap-3 bg-primary/10 border border-primary/30 rounded-xl px-4 py-3">
          <AlertCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-primary">Complete your profile</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Missing: {missing.join(", ")}. Add these to make checkout faster.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-8">
        {/* ── Left: Avatar ── */}
        <div className="flex flex-col items-center gap-3 flex-shrink-0">
          <div className="relative w-32 h-32">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-muted ring-4 ring-primary/30 shadow-lg">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile photo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <User className="w-14 h-14 text-muted-foreground" />
                </div>
              )}
            </div>
            {/* Edit button */}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={avatarBusy}
              className="absolute bottom-1 right-1 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-md hover:bg-primary-hover transition-colors"
              title="Change photo"
            >
              {avatarBusy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Click the camera icon<br />to update your photo
          </p>
        </div>

        {/* ── Right: Form ── */}
        <form onSubmit={save} className="flex-1 space-y-5">
          {/* Email — read-only */}
          <div>
            <Label htmlFor="email" className="text-sm font-medium">Email</Label>
            <Input
              id="email"
              value={user?.email || ""}
              disabled
              className="mt-1 bg-muted/40 text-muted-foreground cursor-not-allowed"
            />
          </div>

          {/* Full Name */}
          <div>
            <Label htmlFor="fn" className="text-sm font-medium">
              Full Name
              {!profile.full_name && <span className="ml-1 text-xs text-primary">(required)</span>}
            </Label>
            <Input
              id="fn"
              placeholder="Enter your Full Name"
              value={profile.full_name}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              className={`mt-1 ${!profile.full_name ? "border-primary/50 focus:ring-primary" : ""}`}
            />
          </div>

          {/* Phone */}
          <div>
            <Label htmlFor="ph" className="text-sm font-medium">
              Phone Number
              {!profile.phone && <span className="ml-1 text-xs text-primary">(required)</span>}
            </Label>
            <Input
              id="ph"
              type="tel"
              placeholder="e.g. 9812345678"
              value={profile.phone}
              maxLength={10}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
              className={`mt-1 ${!profile.phone ? "border-primary/50 focus:ring-primary" : ""}`}
            />
          </div>

          {/* Province */}
          <div>
            <Label htmlFor="province" className="text-sm font-medium">
              Province
              {!profile.province && <span className="ml-1 text-xs text-primary">(required for shipping)</span>}
            </Label>
            <select
              id="province"
              value={profile.province}
              onChange={(e) => setProfile({ ...profile, province: e.target.value, district: "" })}
              className={`mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background ${!profile.province ? "border-primary/50" : ""}`}
            >
              <option value="">— Select Province —</option>
              {Object.keys(NEPAL_DATA).map((prov) => (
                <option key={prov} value={prov}>{prov}</option>
              ))}
            </select>
          </div>

          {/* District */}
          <div>
            <Label htmlFor="district" className="text-sm font-medium">
              District
              {!profile.district && <span className="ml-1 text-xs text-primary">(required for shipping)</span>}
            </Label>
            <select
              id="district"
              value={profile.district}
              onChange={(e) => setProfile({ ...profile, district: e.target.value })}
              disabled={!profile.province}
              className={`mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background ${!profile.district ? "border-primary/50" : ""} ${!profile.province ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <option value="">— Select District —</option>
              {districts.map((dist) => (
                <option key={dist} value={dist}>{dist}</option>
              ))}
            </select>
          </div>

          {/* Shipping Address */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="ad" className="text-sm font-medium">
                Default Shipping Address
                {!profile.address && <span className="ml-1 text-xs text-primary">(required)</span>}
              </Label>
              <button
                type="button"
                onClick={useLocation}
                disabled={locBusy}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary-hover transition-colors"
              >
                {locBusy ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <MapPin className="w-3 h-3" />
                )}
                {locBusy ? "Detecting…" : "Use my location"}
              </button>
            </div>
            <Input
              id="ad"
              placeholder="e.g. Gongabu, Baniyatar"
              value={profile.address}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              className={`${!profile.address ? "border-primary/50 focus:ring-primary" : ""}`}
            />
          </div>

          <Button type="submit" disabled={busy} className="w-full sm:w-auto px-8">
            {busy ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Saving…
              </span>
            ) : (
              "Save"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
