import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DieraHeader from "@/components/header/DieraHeader";
import Footer from "@/components/footer/Footer";
import { useCart, formatNPR } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { initiateEsewaPayment } from "@/lib/esewa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  full_name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(7).max(20),
  address: z.string().trim().min(5).max(500),
  city: z.string().trim().min(2).max(80),
});

type PaymentMethod = "cod" | "khalti" | "esewa";

const Checkout = () => {
  const { items, total, clear } = useCart();
  const { user } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ full_name: "", phone: "", address: "", city: "" });
  const [payment, setPayment] = useState<PaymentMethod>("cod");
  const [busy, setBusy] = useState(false);

  const place = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("Please sign in to place an order"); return nav("/auth/login"); }
    if (items.length === 0) return toast.error("Your bag is empty");
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

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
        fullName: form.full_name,
        phone: form.phone,
        shippingAddress: `${form.address}, ${form.city}`,
      });

      // Handle eSewa payment
      if (payment === "esewa") {
        const order = res.order;
        const productCode = import.meta.env.VITE_ESEWA_PRODUCT_CODE || "EPAYTEST";
        const baseUrl = window.location.origin;
        
        initiateEsewaPayment({
          amount: total,
          total_amount: total,
          transaction_uuid: order._id || order.id,
          product_code: productCode,
          success_url: `${baseUrl}/payment/esewa/success?order_id=${order._id || order.id}`,
          failure_url: `${baseUrl}/payment/esewa/failure`,
        });
        // Don't set busy to false since we're redirecting
        return;
      }

      // For COD and Khalti
      clear();
      toast.success("Order placed! Check your account for updates.");
      nav("/account/orders");
    } catch (err) {
      console.error('Order error:', err);
      toast.error(err instanceof Error ? err.message : "Failed to place order");
    } finally {
      // Only set busy to false if we're not redirecting to eSewa
      if (payment !== "esewa") {
        setBusy(false);
      }
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
                { v: "khalti", label: "Khalti", note: "Pending — gateway integration coming soon." },
                { v: "esewa", label: "eSewa", note: "Pay securely with your eSewa account." },
              ].map((opt) => (
                <label key={opt.v} className={`flex items-start gap-3 p-3 border rounded cursor-pointer ${payment === opt.v ? "border-primary bg-accent/40" : "border-border"}`}>
                  <input type="radio" name="pay" value={opt.v} checked={payment === opt.v} onChange={() => setPayment(opt.v as PaymentMethod)} />
                  <div><p className="text-sm font-medium">{opt.label}</p><p className="text-xs text-muted-foreground">{opt.note}</p></div>
                </label>
              ))}
            </div>

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
    </div>
  );
};

export default Checkout;
