import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DieraHeader from "@/components/header/DieraHeader";
import Footer from "@/components/footer/Footer";
import { useCart, formatNPR } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { z } from "zod";
import { Upload, X, ZoomIn, Download, MapPin, Truck } from "lucide-react";

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

// ─── Validation schema ────────────────────────────────────────────────────────
const schema = z.object({
  full_name: z.string().trim().min(2, "Full name is required").max(80),
  email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  phone: z
    .string()
    .trim()
    .min(7, "Phone number must be at least 7 digits")
    .max(10, "Phone number cannot exceed 10 digits")
    .regex(/^\d+$/, "Phone number must contain only digits"),
  province: z.string().min(1, "Please select a province"),
  district: z.string().min(1, "Please select a district"),
  address: z.string().trim().min(3, "Address is required").max(500),
  landmark: z.string().trim().max(200).optional(),
  note: z.string().trim().max(500).optional(),
});

type PaymentMethod = "phonepay";

const Checkout = () => {
  const { items, total, clear } = useCart();
  const { user } = useAuth();
  const nav = useNavigate();

  const [form, setForm] = useState({
    full_name: "",
    email: user?.email || "",
    phone: "",
    province: "",
    district: "",
    address: "",
    landmark: "",
    note: "",
  });

  const [payment, setPayment] = useState<PaymentMethod>("phonepay");
  const [paymentScreenshot, setPaymentScreenshot] = useState<string | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [shippingFee, setShippingFee] = useState(0);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [qrCodes, setQrCodes] = useState<Array<{ id: string; imageData: string; title: string; category: string }>>([]);
  const [previewQR, setPreviewQR] = useState<{ imageData: string; title: string; category: string } | null>(null);
  const [defaultAddress, setDefaultAddress] = useState("");
  const [useDefaultAddress, setUseDefaultAddress] = useState(true);

  // Derived
  const districts = form.province ? NEPAL_DATA[form.province] ?? [] : [];
  const grandTotal = total + shippingFee;

  // Pre-fill from user profile
  useEffect(() => {
    if (!user) return;
    api.get<{ full_name: string; phone: string; address: string; province: string; district: string }>("/users/profile")
      .then((data) => {
        setForm((f) => ({
          ...f,
          full_name: data.full_name || f.full_name,
          phone: data.phone || f.phone,
          email: user.email || f.email,
          province: data.province || f.province,
          district: data.district || f.district,
        }));
        if (data.address) {
          setDefaultAddress(data.address);
          setUseDefaultAddress(true);
        } else {
          setUseDefaultAddress(false);
        }
      })
      .catch(() => {
        if (user?.email) setForm((f) => ({ ...f, email: user.email! }));
      });
  }, [user]);

  // Fetch shipping fee from backend when district changes OR when using default address with province/district
  useEffect(() => {
    if (!form.province || !form.district) { setShippingFee(0); return; }
    setShippingLoading(true);
    api.get<{ fee: number }>(
      `/shipping-rates/calculate?province=${encodeURIComponent(form.province)}&district=${encodeURIComponent(form.district)}`
    )
      .then((data) => setShippingFee(data.fee ?? 0))
      .catch(() => setShippingFee(0))
      .finally(() => setShippingLoading(false));
  }, [form.province, form.district]);

  // Load QR codes
  useEffect(() => {
    api.get<any[]>("/site-images").then((images) => {
      const qrs = images
        .filter((img) => img.slotKey?.startsWith("payment_qr_"))
        .map((img) => ({
          id: img.id,
          imageData: img.imageData,
          title: img.title || "Payment QR Code",
          category: img.subtitle || "Other",
        }))
        .sort((a, b) => a.category.localeCompare(b.category));
      setQrCodes(qrs);
    }).catch(() => {});
  }, []);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.value;
    if (key === "province") {
      setForm((f) => ({ ...f, province: value, district: "" })); // reset district on province change
    } else {
      setForm((f) => ({ ...f, [key]: value }));
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 10); // digits only, max 10
    setForm((f) => ({ ...f, phone: val }));
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be less than 5MB"); return; }
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file"); return; }
    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPaymentScreenshot(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeScreenshot = () => { setPaymentScreenshot(null); setScreenshotFile(null); };

  const place = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("Please sign in to place an order"); return nav("/auth/login"); }
    if (items.length === 0) return toast.error("Your bag is empty");

    // Build validation data based on whether using default address or manual
    const validationData = {
      full_name: form.full_name,
      email: form.email,
      phone: form.phone,
      province: form.province,
      district: form.district,
      address: useDefaultAddress ? defaultAddress : form.address,
      landmark: form.landmark,
      note: form.note,
    };

    const parsed = schema.safeParse(validationData);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    if (payment === "phonepay" && !paymentScreenshot) return toast.error("Please upload payment screenshot for PhonePay");

    const shippingAddress = useDefaultAddress
      ? [
          defaultAddress,
          form.district,
          form.province,
          "Nepal",
        ].filter(Boolean).join(", ")
      : [
          form.address,
          form.landmark ? `Landmark: ${form.landmark}` : "",
          form.district,
          form.province,
          "Nepal",
        ].filter(Boolean).join(", ");

    setBusy(true);
    try {
      await api.post<{ order: any }>("/orders/create", {
        items: items.map((i) => ({
          productId: i.productId,
          productName: i.name,
          image: i.image,
          categoryName: i.category,
          priceNPR: i.price,
          qty: i.quantity,
          size: i.size || null,
          color: i.color || null,
        })),
        totalNPR: grandTotal,
        paymentMethod: payment,
        paymentScreenshot: paymentScreenshot || undefined,
        fullName: form.full_name,
        phone: form.phone,
        shippingAddress,
        notes: form.note || "",
      });

      clear();
      toast.success("Order placed! Check your account for updates.");
      nav("/account/orders");
    } catch (err) {
      console.error("Order error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to place order");
    } finally {
      setBusy(false);
    }
  };

  // Shared select style
  const selectCls = "w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 disabled:opacity-50";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DieraHeader />
      <main className="flex-1 px-4 sm:px-6 py-8 max-w-5xl mx-auto w-full">
        <h1 className="text-3xl mb-6">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* ── Form ── */}
          <form onSubmit={place} className="lg:col-span-2 space-y-6">

            {/* 1. General Information */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold border-b border-border pb-2">
                1. General Information
              </h2>

              {/* Full Name */}
              <div className="space-y-1">
                <Label htmlFor="full_name">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="full_name"
                  placeholder="Sushanta Maharatta"
                  value={form.full_name}
                  onChange={set("full_name")}
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@gmail.com"
                  value={form.email}
                  onChange={set("email")}
                />
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <Label htmlFor="phone">
                  Phone Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  placeholder="9800000000"
                  maxLength={10}
                  value={form.phone}
                  onChange={handlePhoneChange}
                  required
                />
                <p className="text-xs text-muted-foreground">{form.phone.length}/10 digits</p>
              </div>

              {/* Order Note */}
              <div className="space-y-1">
                <Label htmlFor="note">Order Note (any message for us)</Label>
                <Textarea
                  id="note"
                  rows={2}
                  placeholder="eg: I was searching for this product for so long."
                  value={form.note}
                  onChange={set("note")}
                />
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold border-b border-border pb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                2. Delivery Address
                <span className="text-xs font-normal text-muted-foreground ml-1">(Nepal only)</span>
              </h2>

              {/* Default address chip */}
              {defaultAddress && useDefaultAddress && (
                <div className="flex items-start gap-3 p-3 rounded-lg border border-primary/40 bg-primary/5">
                  <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-primary mb-0.5">Default shipping address</p>
                    <p className="text-sm text-foreground break-words">{defaultAddress}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUseDefaultAddress(false)}
                    className="text-xs text-muted-foreground hover:text-primary underline underline-offset-2 whitespace-nowrap flex-shrink-0 mt-0.5"
                  >
                    Use different address
                  </button>
                </div>
              )}

              {/* Switch back to default */}
              {defaultAddress && !useDefaultAddress && (
                <button
                  type="button"
                  onClick={() => setUseDefaultAddress(true)}
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <MapPin className="w-3 h-3" />
                  Use my default address instead
                </button>
              )}

              {/* Manual address fields — shown when useDefaultAddress is false or no default exists */}
              {!useDefaultAddress && (
                <>
              {/* Province */}
              <div className="space-y-1">
                <Label htmlFor="province">
                  Province <span className="text-destructive">*</span>
                </Label>
                <select
                  id="province"
                  className={selectCls}
                  value={form.province}
                  onChange={set("province")}
                  required
                >
                  <option value="">— Select Province —</option>
                  {Object.keys(NEPAL_DATA).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* District */}
              <div className="space-y-1">
                <Label htmlFor="district">
                  District <span className="text-destructive">*</span>
                </Label>
                <select
                  id="district"
                  className={selectCls}
                  value={form.district}
                  onChange={set("district")}
                  required
                  disabled={!form.province}
                >
                  <option value="">— Select District —</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Address */}
              <div className="space-y-1">
                <Label htmlFor="address">
                  Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="address"
                  placeholder="Pulchowk"
                  value={form.address}
                  onChange={set("address")}
                  required
                />
              </div>

              {/* Landmark */}
              <div className="space-y-1">
                <Label htmlFor="landmark">Landmark</Label>
                <Input
                  id="landmark"
                  placeholder="eg: Labim Mall"
                  value={form.landmark}
                  onChange={set("landmark")}
                />
              </div>
                </>
              )}

              {/* Shipping fee badge - show for both default and manual address */}
              {form.district && (
                <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-accent/30 px-4 py-3">
                  <Truck className="w-4 h-4 text-primary flex-shrink-0" />
                  <div className="text-sm">
                    <span className="font-medium">Shipping to {form.district}, {form.province}:</span>{" "}
                    {shippingLoading
                      ? <span className="text-muted-foreground text-xs">Calculating…</span>
                      : <span className="text-primary font-semibold">{formatNPR(shippingFee)}</span>
                    }
                  </div>
                </div>
              )}

              {!form.district && !useDefaultAddress && (
                <div className="rounded-lg p-3 bg-accent/20 border border-border">
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <Truck className="w-3.5 h-3.5" />
                    Select a district to see your shipping cost. Shipping fee is added to your total.
                  </p>
                </div>
              )}
            </section>

            {/* 3. Payment */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold border-b border-border pb-2">3. Payment</h2>
              <div className="space-y-2">
                <label className="flex items-start gap-3 p-3 border border-primary bg-accent/40 rounded cursor-default">
                  <input type="radio" name="pay" value="phonepay" checked={true} readOnly />
                  <div>
                    <p className="text-sm font-medium">Online Payment</p>
                    <p className="text-xs text-muted-foreground">Scan QR code and upload payment screenshot.</p>
                  </div>
                </label>
              </div>

              {/* PhonePay QR + screenshot */}
              <div className="mt-4 p-4 border border-primary/30 rounded-lg bg-accent/20">
                  <h3 className="text-sm font-semibold mb-3">Online Payment</h3>

                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground mb-3">Scan any QR code below to make payment:</p>
                    {qrCodes.length > 0 ? (
                      <div className="flex gap-3 overflow-x-auto pb-2">
                        {qrCodes.map((qr) => (
                          <div key={qr.id} className="bg-white rounded border p-3 relative group flex-shrink-0">
                            <p className="text-xs font-semibold text-primary mb-2 text-center">{qr.category}</p>
                            <div className="w-40 h-40 cursor-pointer relative" onClick={() => setPreviewQR(qr)}>
                              <img src={qr.imageData} alt={qr.title} className="w-full h-full object-contain" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                                <ZoomIn className="w-6 h-6 text-white" />
                              </div>
                            </div>
                            <p className="text-[10px] text-center text-muted-foreground mt-2 line-clamp-1">{qr.title}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex justify-center p-6 bg-white rounded-lg border">
                        <div className="text-center text-xs text-muted-foreground">
                          No payment QR codes available.<br />
                          <span className="text-[10px]">Contact admin to add payment methods.</span>
                        </div>
                      </div>
                    )}
                    <p className="text-l text-muted-foreground mt-3 text-center font-semibold">
                      Amount to pay: <span className="text-foreground">{formatNPR(grandTotal)}</span>
                    </p>
                  </div>

                  {/* Screenshot */}
                  <div>
                    <Label className="text-sm">Upload Payment Screenshot *</Label>
                    <p className="text-xs text-muted-foreground mb-2">Upload screenshot of successful payment</p>
                    {!paymentScreenshot ? (
                      <div className="mt-2">
                        <input type="file" accept="image/*" onChange={handleScreenshotUpload} className="hidden" id="payment-screenshot" />
                        <label htmlFor="payment-screenshot" className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary hover:bg-accent/50 transition-colors">
                          <Upload className="w-5 h-5 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Click to upload screenshot</span>
                        </label>
                        <p className="text-xs text-muted-foreground mt-1">Max file size: 5MB</p>
                      </div>
                    ) : (
                      <div className="mt-2 relative">
                        <img src={paymentScreenshot} alt="Payment screenshot" className="w-full max-h-64 object-contain border rounded-lg" />
                        <button type="button" onClick={removeScreenshot} className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:scale-110 transition-transform">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
            </section>

            <Button type="submit" disabled={busy || items.length === 0} className="w-full sm:w-auto">
              {busy ? "Placing…" : `Place order · ${formatNPR(grandTotal)}`}
            </Button>
          </form>

          {/* ── Order Summary ── */}
          <aside className="border border-border rounded-lg bg-card p-4 h-fit sticky top-24">
            <h3 className="font-semibold mb-3 border-b border-border pb-2">Your Bag</h3>
            <div className="space-y-3 mb-4">
              {items.map((i) => (
                <div key={`${i.productId}-${i.size}-${i.color}`} className="flex gap-3">
                  {/* Product Image */}
                  <div className="w-16 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
                    {i.image && (
                      <img src={i.image} alt={i.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  
                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{i.name}</p>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {i.color && <p>Color: {i.color}</p>}
                      {i.size && <p>Size: {i.size}</p>}
                    </div>
                  </div>
                  
                  {/* Quantity and Price */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-medium">x{i.quantity}</p>
                    <p className="text-sm font-semibold">{formatNPR(i.price * i.quantity)}</p>
                  </div>
                </div>
              ))}
              {items.length === 0 && <p className="text-sm text-muted-foreground">Empty.</p>}
            </div>

            <div className="border-t border-border pt-3 space-y-2">
              <div className="flex justify-between text-sm pb-2 border-b border-border">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatNPR(total)}</span>
              </div>
              
              {/* Shipping Fee */}
              <div className="text-sm">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5" /> Shipping Fee
                  </span>
                  <span className="font-medium">
                    {form.district
                      ? formatNPR(shippingFee)
                      : <span className="text-muted-foreground text-xs">Select district</span>}
                  </span>
                </div>
                {/* Show shipping address if available */}
                {form.district && form.province && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {useDefaultAddress && defaultAddress ? defaultAddress : form.address}
                    {form.district && form.province && (
                      <span className="block">{form.district}, {form.province}, Nepal</span>
                    )}
                  </p>
                )}
              </div>
              
              <div className="flex justify-between font-semibold pt-2 border-t border-border">
                <span>Total</span>
                <span className="text-lg">{formatNPR(grandTotal)}</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground leading-relaxed">
                * Total amount includes shipping. Please pay the full amount shown.
              </p>
            </div>
          </aside>
        </div>
      </main>
      <Footer />

      {/* QR Preview Dialog */}
      <Dialog open={!!previewQR} onOpenChange={(open) => !open && setPreviewQR(null)}>
        <DialogContent className="max-w-sm p-4">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base">{previewQR?.category}</DialogTitle>
          </DialogHeader>
          {previewQR && (
            <div className="flex flex-col items-center gap-3">
              <div className="w-full bg-white rounded-lg border p-3">
                <img src={previewQR.imageData} alt={previewQR.title} className="w-full h-auto object-contain" />
              </div>
              <p className="text-xs text-muted-foreground text-center leading-relaxed">
                Scan this QR code with your payment app to complete the transaction
              </p>
              <p className="text-sm font-semibold">Amount: {formatNPR(grandTotal)}</p>
              <a
                href={previewQR.imageData}
                download={`${previewQR.category}-QR.png`}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Download className="w-3.5 h-3.5" /> Download QR Code
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Checkout;
