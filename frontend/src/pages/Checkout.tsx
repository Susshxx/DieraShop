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
import { Upload, X, ZoomIn } from "lucide-react";

const schema = z.object({
  full_name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(7).max(20),
  address: z.string().trim().min(5).max(500),
  city: z.string().trim().min(2).max(80),
});

type PaymentMethod = "cod" | "phonepay";

const Checkout = () => {
  const { items, total, clear } = useCart();
  const { user } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ full_name: "", phone: "", address: "", city: "" });
  const [payment, setPayment] = useState<PaymentMethod>("cod");
  const [paymentScreenshot, setPaymentScreenshot] = useState<string | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [qrCodes, setQrCodes] = useState<Array<{ id: string; imageData: string; title: string; category: string }>>([]);
  const [previewQR, setPreviewQR] = useState<{ imageData: string; title: string; category: string } | null>(null);

  useEffect(() => {
    // Load Payment QR codes
    const loadQRCodes = async () => {
      try {
        const images = await api.get<any[]>("/site-images");
        const paymentQRs = images
          .filter(img => img.slotKey?.startsWith('payment_qr_'))
          .map(img => ({
            id: img.id,
            imageData: img.imageData,
            title: img.title || 'Payment QR Code',
            category: img.subtitle || 'Other',
          }))
          .sort((a, b) => (a.category || '').localeCompare(b.category || ''));
        
        setQrCodes(paymentQRs);
      } catch (error) {
        console.error("Failed to load QR codes:", error);
      }
    };
    
    loadQRCodes();
  }, []);

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    setScreenshotFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPaymentScreenshot(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeScreenshot = () => {
    setPaymentScreenshot(null);
    setScreenshotFile(null);
  };

  const place = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("Please sign in to place an order"); return nav("/auth/login"); }
    if (items.length === 0) return toast.error("Your bag is empty");
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    // Validate PhonePay payment screenshot
    if (payment === "phonepay" && !paymentScreenshot) {
      return toast.error("Please upload payment screenshot for PhonePay");
    }

    setBusy(true);

    try {
      const res = await api.post<{ order: any }>("/orders/create", {
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
        totalNPR: total,
        paymentMethod: payment,
        paymentScreenshot: paymentScreenshot || undefined,
        fullName: form.full_name,
        phone: form.phone,
        shippingAddress: `${form.address}, ${form.city}`,
      });

      clear();
      toast.success("Order placed! Check your account for updates.");
      nav("/account/orders");
    } catch (err) {
      console.error('Order error:', err);
      toast.error(err instanceof Error ? err.message : "Failed to place order");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DieraHeader />
      <main className="flex-1 px-4 sm:px-6 py-8 max-w-5xl mx-auto w-full">
        <h1 className="text-3xl mb-6">Checkout</h1>
        <div className="grid lg:grid-cols-3 gap-8">
          <form onSubmit={place} className="lg:col-span-2 space-y-4">
            <h2 className="text-xl">Shipping</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Full name</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /></div>
            </div>
            <div><Label>Address</Label><Textarea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required /></div>
            <div><Label>City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required /></div>

            <h2 className="text-xl pt-4">Payment</h2>
            <div className="space-y-2">
              {[
                { v: "cod", label: "Cash on Delivery", note: "Pay when your order arrives." },
                { v: "phonepay", label: "PhonePay", note: "Scan QR code and upload payment screenshot." },
              ].map((opt) => (
                <label key={opt.v} className={`flex items-start gap-3 p-3 border rounded cursor-pointer ${payment === opt.v ? "border-primary bg-accent/40" : "border-border"}`}>
                  <input type="radio" name="pay" value={opt.v} checked={payment === opt.v} onChange={() => setPayment(opt.v as PaymentMethod)} />
                  <div><p className="text-sm font-medium">{opt.label}</p><p className="text-xs text-muted-foreground">{opt.note}</p></div>
                </label>
              ))}
            </div>

            {/* PhonePay/Online Payment QR Code and Screenshot Upload */}
            {payment === "phonepay" && (
              <div className="mt-4 p-4 border border-primary/30 rounded-lg bg-accent/20">
                <h3 className="text-sm font-semibold mb-3">Online Payment</h3>
                
                {/* QR Code Section - All QR codes in horizontal layout */}
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground mb-3">Scan any QR code below to make payment:</p>
                  {qrCodes.length > 0 ? (
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {qrCodes.map((qr) => (
                        <div key={qr.id} className="bg-white rounded border p-3 relative group flex-shrink-0">
                          <p className="text-xs font-semibold text-primary mb-2 text-center">{qr.category}</p>
                          <div 
                            className="w-40 h-40 cursor-pointer relative"
                            onClick={() => setPreviewQR(qr)}
                          >
                            <img
                              src={qr.imageData}
                              alt={qr.title}
                              className="w-full h-full object-contain"
                            />
                            {/* Zoom overlay on hover */}
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
                        No payment QR codes available.<br/>
                        <span className="text-[10px]">Contact admin to add payment methods.</span>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-3 text-center font-semibold">
                    Amount to pay: <span className="text-foreground">{formatNPR(total)}</span>
                  </p>
                </div>

                {/* Screenshot Upload Section */}
                <div>
                  <Label className="text-sm">Upload Payment Screenshot *</Label>
                  <p className="text-xs text-muted-foreground mb-2">Upload screenshot of successful payment</p>
                  
                  {!paymentScreenshot ? (
                    <div className="mt-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleScreenshotUpload}
                        className="hidden"
                        id="payment-screenshot"
                      />
                      <label
                        htmlFor="payment-screenshot"
                        className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary hover:bg-accent/50 transition-colors"
                      >
                        <Upload className="w-5 h-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Click to upload screenshot</span>
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">Max file size: 5MB</p>
                    </div>
                  ) : (
                    <div className="mt-2 relative">
                      <img
                        src={paymentScreenshot}
                        alt="Payment screenshot"
                        className="w-full max-h-64 object-contain border rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={removeScreenshot}
                        className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:scale-110 transition-transform"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <Button type="submit" disabled={busy || items.length === 0} className="w-full sm:w-auto">{busy ? "Placing…" : `Place order · ${formatNPR(total)}`}</Button>
          </form>

          <aside className="border border-border rounded-lg bg-card p-4 h-fit">
            <h3 className="font-semibold mb-3">Your bag</h3>
            <div className="space-y-2 mb-4">
              {items.map((i) => (
                <div key={`${i.productId}-${i.size}-${i.color}`} className="text-sm">
                  <div className="flex justify-between">
                    <span className="truncate pr-2">{i.name} × {i.quantity}</span>
                    <span className="font-medium">{formatNPR(i.price * i.quantity)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground space-x-2">
                    {i.color && <span>Color: {i.color}</span>}
                    {i.size && <span>Size: {i.size}</span>}
                  </div>
                </div>
              ))}
              {items.length === 0 && <p className="text-sm text-muted-foreground">Empty.</p>}
            </div>
            <div className="border-t border-border pt-3 flex justify-between font-semibold"><span>Total</span><span>{formatNPR(total)}</span></div>
          </aside>
        </div>
      </main>
      <Footer />

      {/* QR Code Preview Dialog */}
      <Dialog open={!!previewQR} onOpenChange={(open) => !open && setPreviewQR(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{previewQR?.category} - {previewQR?.title}</DialogTitle>
          </DialogHeader>
          {previewQR && (
            <div className="flex flex-col items-center">
              <div className="w-full max-w-lg bg-white rounded-lg border p-4">
                <img
                  src={previewQR.imageData}
                  alt={previewQR.title}
                  className="w-full h-auto object-contain"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Scan this QR code with your payment app to complete the transaction
              </p>
              <p className="text-sm font-semibold mt-2">
                Amount: {formatNPR(total)}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Checkout;
