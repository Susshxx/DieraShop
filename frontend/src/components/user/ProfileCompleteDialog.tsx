import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2, X, User, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const SNOOZE_KEY = "diera_profile_prompt_snoozed_until";
const SNOOZE_HOURS = 24;

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

const ProfileCompleteDialog = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [profile, setProfile] = useState({ full_name: "", phone: "", address: "", province: "", district: "" });
  const [missing, setMissing] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [locBusy, setLocBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const hasFetched = useRef(false);
  
  // Derived
  const districts = profile.province ? NEPAL_DATA[profile.province] ?? [] : [];

  useEffect(() => {
    // Only for logged-in non-admin users
    if (!user || user.role === "admin") return;
    if (hasFetched.current) return;

    // Check if snoozed within the last 24 hours
    const snoozedUntil = localStorage.getItem(SNOOZE_KEY);
    if (snoozedUntil && Date.now() < Number(snoozedUntil)) return;

    hasFetched.current = true;

    api
      .get<{ full_name: string; phone: string; address: string; province: string; district: string }>("/users/profile")
      .then((data) => {
        const p = {
          full_name: data.full_name || "",
          phone: data.phone || "",
          address: data.address || "",
          province: data.province || "",
          district: data.district || "",
        };
        const m: string[] = [];
        if (!p.full_name) m.push("Full Name");
        if (!p.phone) m.push("Phone Number");
        if (!p.address) m.push("Shipping Address");

        if (m.length > 0) {
          setProfile(p);
          setMissing(m);
          setShow(true);
        }
      })
      .catch(() => {});
  }, [user]);

  const dismiss = () => {
    // Snooze for 24 hours
    localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_HOURS * 60 * 60 * 1000));
    setShow(false);
  };

  const goToProfile = () => {
    dismiss();
    navigate("/account/profile");
  };

  const save = async () => {
    setBusy(true);
    try {
      await api.patch("/users/profile", {
        full_name: profile.full_name,
        phone: profile.phone,
        address: profile.address,
        province: profile.province,
        district: profile.district,
      });
      setSaved(true);
      toast.success("Profile saved!");
      setTimeout(() => {
        localStorage.removeItem(SNOOZE_KEY); // no need to snooze — profile is complete
        setShow(false);
      }, 1500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }
    setLocBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
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
            : data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          
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
          toast.error("Could not resolve location");
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

  if (!show) return null;

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div
        className="relative w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300"
      >
        {/* Top accent bar */}
        <div className="h-1.5 bg-gradient-to-r from-primary via-primary/70 to-primary/30" />

        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="px-6 pt-5 pb-6">
          {saved ? (
            /* Success state */
            <div className="flex flex-col items-center py-6 gap-3">
              <CheckCircle2 className="w-14 h-14 text-primary" />
              <p className="text-lg font-semibold">Profile complete!</p>
              <p className="text-sm text-muted-foreground">You're all set. Enjoy shopping!</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold leading-tight">Complete your profile</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Add your details to make checkout faster
                  </p>
                </div>
              </div>

              {/* Missing fields list */}
              <div className="flex gap-1.5 flex-wrap mb-4">
                {missing.map((m) => (
                  <span
                    key={m}
                    className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full"
                  >
                    {m}
                  </span>
                ))}
              </div>

              {/* Inline fields */}
              <div className="space-y-3">
                {missing.includes("Full Name") && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Full Name</label>
                    <Input
                      placeholder="Enter your full name"
                      value={profile.full_name}
                      onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    />
                  </div>
                )}
                {missing.includes("Phone Number") && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone Number</label>
                    <Input
                      type="tel"
                      placeholder="e.g. 9812345678"
                      value={profile.phone}
                      maxLength={10}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                    />
                  </div>
                )}
                {missing.includes("Shipping Address") && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-muted-foreground block">Shipping Address</label>
                      <button
                        type="button"
                        onClick={useMyLocation}
                        disabled={locBusy}
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        {locBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
                        {locBusy ? "Detecting…" : "Use my location"}
                      </button>
                    </div>
                    
                    {/* Province dropdown */}
                    <select
                      value={profile.province}
                      onChange={(e) => setProfile({ ...profile, province: e.target.value, district: "" })}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm mb-2"
                    >
                      <option value="">— Select Province —</option>
                      {Object.keys(NEPAL_DATA).map((prov) => (
                        <option key={prov} value={prov}>{prov}</option>
                      ))}
                    </select>
                    
                    {/* District dropdown */}
                    <select
                      value={profile.district}
                      onChange={(e) => setProfile({ ...profile, district: e.target.value })}
                      disabled={!profile.province}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm mb-2 disabled:opacity-50"
                    >
                      <option value="">— Select District —</option>
                      {districts.map((dist) => (
                        <option key={dist} value={dist}>{dist}</option>
                      ))}
                    </select>
                    
                    <Input
                      placeholder="e.g. Gongabu, Baniyatar"
                      value={profile.address}
                      onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-5">
                <Button onClick={save} disabled={busy} className="flex-1">
                  {busy ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving…
                    </span>
                  ) : (
                    "Save"
                  )}
                </Button>
                <Button variant="outline" onClick={goToProfile} className="flex-1">
                  Go to profile
                </Button>
              </div>

              <button
                onClick={dismiss}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground mt-3 transition-colors"
              >
                Remind me later
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileCompleteDialog;
