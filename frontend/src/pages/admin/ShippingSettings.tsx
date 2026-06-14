import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Trash2, Plus, ChevronDown, ChevronUp, Pencil, Check, X } from "lucide-react";

// ─── Nepal provinces & districts (same as checkout) ──────────────────────────
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

interface Rate {
  _id: string;
  province: string;
  district: string | null;
  fee: number;
}

// ─── Inline editable fee cell ─────────────────────────────────────────────────
const FeeCell = ({
  rate,
  onSave,
  onDelete,
}: {
  rate: Rate;
  onSave: (id: string, fee: number) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(rate.fee));

  const commit = async () => {
    const n = Number(val);
    if (isNaN(n) || n < 0) return toast.error("Enter a valid fee (≥ 0)");
    await onSave(rate._id, n);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-muted-foreground text-xs">Rs.</span>
        <Input
          type="number"
          min={0}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className="h-7 w-24 text-xs"
          autoFocus
          onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
        />
        <button onClick={commit} className="text-primary hover:text-primary/80"><Check className="w-4 h-4" /></button>
        <button onClick={() => setEditing(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">Rs. {rate.fee}</span>
      <button onClick={() => { setVal(String(rate.fee)); setEditing(true); }} className="text-muted-foreground hover:text-foreground">
        <Pencil className="w-3.5 h-3.5" />
      </button>
      <button onClick={() => onDelete(rate._id)} className="text-destructive hover:text-destructive/80">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

// ─── Add rate form ────────────────────────────────────────────────────────────
const AddRateForm = ({
  province,
  existingRates,
  onAdd,
}: {
  province: string;
  existingRates: Rate[];
  onAdd: (province: string, district: string | null, fee: number) => Promise<void>;
}) => {
  const [open, setOpen] = useState(false);
  const [district, setDistrict] = useState<string>("__province__");
  const [fee, setFee] = useState("");
  const districts = NEPAL_DATA[province] ?? [];

  // Districts that already have a rate
  const taken = new Set(existingRates.map((r) => r.district ?? "__province__"));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(fee);
    if (isNaN(n) || n < 0) return toast.error("Enter a valid fee");
    await onAdd(province, district === "__province__" ? null : district, n);
    setFee("");
    setDistrict("__province__");
    setOpen(false);
  };

  return (
    <div className="mt-2">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <Plus className="w-3 h-3" /> Add rate
        </button>
      ) : (
        <form onSubmit={submit} className="flex flex-wrap items-center gap-2 mt-1 p-2 bg-accent/30 rounded">
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="h-8 text-xs border border-input rounded px-2 bg-background"
          >
            <option value="__province__" disabled={taken.has("__province__")}>
              Whole province {taken.has("__province__") ? "(set)" : ""}
            </option>
            {districts.map((d) => (
              <option key={d} value={d} disabled={taken.has(d)}>
                {d} {taken.has(d) ? "(set)" : ""}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">Rs.</span>
            <Input
              type="number"
              min={0}
              placeholder="0"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              className="h-8 w-24 text-xs"
              required
            />
          </div>
          <Button type="submit" size="sm" className="h-8 text-xs">Save</Button>
          <button type="button" onClick={() => setOpen(false)} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
        </form>
      )}
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────
const AdminShippingSettings = () => {
  const [rates, setRates] = useState<Rate[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const load = async () => {
    try {
      const data = await api.get<Rate[]>("/shipping-rates");
      setRates(data);
    } catch {
      toast.error("Failed to load shipping rates");
    }
  };

  useEffect(() => { load(); }, []);

  const toggle = (province: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(province) ? next.delete(province) : next.add(province);
      return next;
    });

  const handleAdd = async (province: string, district: string | null, fee: number) => {
    try {
      await api.put("/shipping-rates", { province, district, fee });
      toast.success("Shipping rate saved");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save rate");
    }
  };

  const handleSave = async (_id: string, fee: number) => {
    const rate = rates.find((r) => r._id === _id);
    if (!rate) return;
    try {
      await api.put("/shipping-rates", { province: rate.province, district: rate.district, fee });
      toast.success("Rate updated");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    }
  };

  const handleDelete = async (_id: string) => {
    try {
      await api.delete(`/shipping-rates/${_id}`);
      toast.success("Rate removed");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const ratesByProvince = (province: string) =>
    rates.filter((r) => r.province === province);

  return (
    <div>
      <h1 className="text-2xl mb-2">Shipping Settings</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Set shipping fees by <strong>province</strong>. Optionally add district-level overrides — district rates take priority over the province rate.
      </p>

      <div className="space-y-3">
        {Object.keys(NEPAL_DATA).map((province) => {
          const provinceRates = ratesByProvince(province);
          const provinceRate = provinceRates.find((r) => r.district === null);
          const districtRates = provinceRates.filter((r) => r.district !== null);
          const isOpen = expanded.has(province);

          return (
            <div key={province} className="border border-border rounded-lg bg-card overflow-hidden">
              {/* Province header row */}
              <div className="flex items-center justify-between px-4 py-3 bg-card">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => toggle(province)}
                    className="flex items-center gap-2 font-medium text-sm hover:text-primary"
                  >
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {province}
                  </button>
                  {districtRates.length > 0 && (
                    <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                      {districtRates.length} district override{districtRates.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">Province rate:</span>
                  {provinceRate ? (
                    <FeeCell rate={provinceRate} onSave={handleSave} onDelete={handleDelete} />
                  ) : (
                    <span className="text-xs text-muted-foreground italic">not set</span>
                  )}
                </div>
              </div>

              {/* Expanded: district overrides */}
              {isOpen && (
                <div className="border-t border-border px-4 py-3 bg-accent/10">
                  <p className="text-xs text-muted-foreground mb-3">
                    District overrides — these take priority over the province rate above.
                  </p>
                  {districtRates.length > 0 ? (
                    <div className="space-y-2 mb-3">
                      {districtRates.map((r) => (
                        <div key={r._id} className="flex items-center justify-between text-sm py-1.5 px-3 bg-card border border-border rounded">
                          <span>{r.district}</span>
                          <FeeCell rate={r} onSave={handleSave} onDelete={handleDelete} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mb-3 italic">
                      No district overrides. All districts in this province use the province rate above.
                    </p>
                  )}

                  <AddRateForm
                    province={province}
                    existingRates={provinceRates}
                    onAdd={handleAdd}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-accent/20 rounded-lg border border-border text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">How shipping rates work</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>When a customer selects a <strong>province + district</strong>, the system checks for a district-level rate first.</li>
          <li>If no district rate exists, it falls back to the province-level rate.</li>
          <li>If neither is set, shipping is shown as <strong>Rs. 0</strong>.</li>
          <li>Click the ✏ icon on any rate to edit it inline. Changes take effect immediately.</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminShippingSettings;
