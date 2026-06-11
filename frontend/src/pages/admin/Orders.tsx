import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatNPR } from "@/hooks/useCart";
import { toast } from "sonner";
import { Trash2, Eye } from "lucide-react";

const STATUSES = ["pending", "confirmed", "shipped", "delivered"] as const;
type OrderStatus = typeof STATUSES[number];

// Define which statuses can transition to which
const canTransitionTo = (currentStatus: string, targetStatus: OrderStatus): boolean => {
  const statusOrder = {
    'pending': 0,
    'awaiting_payment': 0,
    'confirmed': 1,
    'shipped': 2,
    'delivered': 3,
  };
  
  const current = statusOrder[currentStatus as keyof typeof statusOrder] ?? 0;
  const target = statusOrder[targetStatus];
  
  // Can only move forward, not backward
  return target > current;
};

const AdminOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewOrder, setViewOrder] = useState<any | null>(null);
  
  const load = () => api.get<any[]>("/admin/orders").then(setOrders).catch(() => {});
  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: OrderStatus) => {
    try {
      await api.patch(`/admin/orders/${id}/status`, { status });
      toast.success("Status updated successfully");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  };

  const deleteOrder = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/admin/orders/${deleteId}`);
      toast.success("Order deleted successfully");
      setDeleteId(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <div>
      <h1 className="text-2xl mb-6">Orders</h1>
      <div className="space-y-3">
        {orders.map((o) => (
          <div key={o.id} className="border border-border rounded-lg bg-card p-4">
            <div className="flex flex-wrap justify-between gap-2">
              <div className="flex-1">
                <p className="font-medium">#{String(o.id).slice(-8)} · {o.profiles?.full_name || o.full_name || "—"}</p>
                <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()} · {o.payment_method?.toUpperCase()}</p>
                {o.shipping_address && <p className="text-xs text-muted-foreground mt-1">{o.shipping_address}</p>}
                {o.phone && <p className="text-xs text-muted-foreground">Phone: {o.phone}</p>}
              </div>
              <div className="text-right">
                <Badge>{o.status}</Badge>
                <p className="mt-1 font-semibold">{formatNPR(o.total_npr)}</p>
                <div className="flex gap-1 mt-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewOrder(o)}
                    className="text-primary hover:text-primary"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  {['pending', 'awaiting_payment'].includes(o.status) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(o.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-3 text-sm">
              {o.order_items?.map((it: any) => (
                <div key={it.id || it.product_name} className="flex justify-between text-muted-foreground">
                  <span>{it.product_name} × {it.qty}{it.size ? ` (${it.size})` : ""}{it.color ? ` - ${it.color}` : ""}</span>
                  <span>{formatNPR(it.price_npr * it.qty)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {STATUSES.map((s) => {
                const isCurrentStatus = o.status === s;
                const canTransition = canTransitionTo(o.status, s);
                const isDisabled = isCurrentStatus || !canTransition;
                
                return (
                  <button 
                    key={s} 
                    disabled={isDisabled} 
                    onClick={() => setStatus(o.id, s)}
                    className={`text-xs px-2 py-1 rounded border ${
                      isCurrentStatus 
                        ? "bg-primary text-primary-foreground border-primary" 
                        : isDisabled
                        ? "border-border bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {orders.length === 0 && <p className="text-muted-foreground">No orders yet.</p>}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this order? This action cannot be undone and will permanently remove the order from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteOrder} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!viewOrder} onOpenChange={(open) => !open && setViewOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {viewOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Order ID</p>
                  <p className="font-mono">#{String(viewOrder.id).slice(-8)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge>{viewOrder.status}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date</p>
                  <p>{new Date(viewOrder.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="font-semibold">{formatNPR(viewOrder.total_npr)}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Customer Information</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Name:</span> {viewOrder.full_name}</p>
                  <p><span className="font-medium">Phone:</span> {viewOrder.phone}</p>
                  {viewOrder.profiles?.email && (
                    <p><span className="font-medium">Email:</span> {viewOrder.profiles.email}</p>
                  )}
                  <p><span className="font-medium">Address:</span> {viewOrder.shipping_address}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Payment Information</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Method:</span> {viewOrder.payment_method?.toUpperCase()}</p>
                  {viewOrder.paymentDetails?.transactionId && (
                    <p><span className="font-medium">Transaction ID:</span> {viewOrder.paymentDetails.transactionId}</p>
                  )}
                  {viewOrder.paymentDetails?.status && (
                    <p><span className="font-medium">Payment Status:</span> {viewOrder.paymentDetails.status}</p>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Order Items</h3>
                <div className="space-y-3">
                  {viewOrder.order_items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-start border-b pb-2">
                      <div className="flex-1">
                        <p className="font-medium">{item.product_name}</p>
                        <div className="text-sm text-muted-foreground space-y-1">
                          {item.size && <p>Size: {item.size}</p>}
                          {item.color && <p>Color: {item.color}</p>}
                          <p>Quantity: {item.qty}</p>
                          <p>Price: {formatNPR(item.price_npr)} each</p>
                        </div>
                      </div>
                      <p className="font-semibold">{formatNPR(item.price_npr * item.qty)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {viewOrder.notes && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Order Notes</h3>
                  <p className="text-sm text-muted-foreground">{viewOrder.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
