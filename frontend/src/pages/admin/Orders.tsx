// import { useEffect, useState } from "react";
// import { Link, useSearchParams } from "react-router-dom";
// import { api } from "@/lib/api";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { formatNPR } from "@/hooks/useCart";
// import { toast } from "sonner";
// import { Trash2, Eye, ZoomIn, X, Ban } from "lucide-react";

// // Helper function to convert product name to slug
// const nameToSlug = (name: string) => {
//   return name
//     .toLowerCase()
//     .replace(/[^a-z0-9]+/g, '-')
//     .replace(/^-+|-+$/g, '');
// };

// // Helper function to get custom badge className for pink
// const getStatusClassName = (status: string): string => {
//   if (['confirmed', 'shipped', 'delivered'].includes(status)) {
//     return 'bg-pink-100 text-pink-700 hover:bg-pink-100 border-pink-200';
//   }
//   return '';
// };

// const STATUSES = ["pending", "confirmed", "shipped", "delivered"] as const;
// type OrderStatus = typeof STATUSES[number];

// // Define which statuses can transition to which
// const canTransitionTo = (currentStatus: string, targetStatus: OrderStatus): boolean => {
//   const statusOrder = {
//     'pending': 0,
//     'awaiting_payment': 0,
//     'confirmed': 1,
//     'shipped': 2,
//     'delivered': 3,
//   };
  
//   const current = statusOrder[currentStatus as keyof typeof statusOrder] ?? 0;
//   const target = statusOrder[targetStatus];
  
//   // Can only move forward, not backward
//   return target > current;
// };

// const AdminOrders = () => {
//   const [searchParams, setSearchParams] = useSearchParams();
//   const [orders, setOrders] = useState<any[]>([]);
//   const [deleteId, setDeleteId] = useState<string | null>(null);
//   const [deleteLabel, setDeleteLabel] = useState<"delete" | "reject">("delete");
//   const [cancelId, setCancelId] = useState<string | null>(null);
//   const [cancelReason, setCancelReason] = useState<string>("");
//   const [viewOrder, setViewOrder] = useState<any | null>(null);
//   const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  
//   const load = () => api.get<any[]>("/admin/orders").then(setOrders).catch(() => {});
  
//   useEffect(() => { 
//     load(); 
//   }, []);

//   // Auto-open order if orderId is in URL params
//   useEffect(() => {
//     const orderId = searchParams.get('orderId');
//     if (orderId && orders.length > 0) {
//       const order = orders.find(o => o.id === orderId || String(o.id).slice(-8) === orderId.slice(-8));
//       if (order) {
//         setViewOrder(order);
//         // Remove orderId from URL after opening
//         setSearchParams({});
//       }
//     }
//   }, [orders, searchParams, setSearchParams]);

//   const setStatus = async (id: string, status: OrderStatus) => {
//     try {
//       await api.patch(`/admin/orders/${id}/status`, { status });
//       toast.success("Status updated successfully");
//       load();
//     } catch (err) {
//       toast.error(err instanceof Error ? err.message : "Update failed");
//     }
//   };

//   const deleteOrder = async () => {
//     if (!deleteId) return;
//     try {
//       await api.delete(`/admin/orders/${deleteId}`);
//       toast.success(deleteLabel === "reject" ? "Order rejected and deleted" : "Order deleted successfully");
//       setDeleteId(null);
//       setViewOrder(null);
//       load();
//     } catch (err) {
//       toast.error(err instanceof Error ? err.message : "Delete failed");
//     }
//   };

//   const cancelOrder = async () => {
//     if (!cancelId || !cancelReason) {
//       toast.error("Please select a cancellation reason");
//       return;
//     }
//     try {
//       await api.post(`/admin/orders/${cancelId}/cancel`, { reason: cancelReason });
//       toast.success("Order cancelled successfully");
//       setCancelId(null);
//       setCancelReason("");
//       setViewOrder(null);
//       load();
//     } catch (err) {
//       toast.error(err instanceof Error ? err.message : "Cancel failed");
//     }
//   };

//   const CANCELLATION_REASONS = [
//     "Item out of stock",
//     "Delay in delivery/receiving product",
//     "Customer request",
//     "Payment issue",
//     "Address verification failed",
//     "Other operational issues"
//   ];

//   return (
//     <div>
//       <h1 className="text-2xl mb-6">Orders</h1>
//       <div className="space-y-3">
//         {orders.map((o) => (
//           <div key={o.id} className="border border-border rounded-lg bg-card p-4">
//             <div className="flex flex-wrap justify-between gap-2">
//               <div className="flex-1">
//                 <p className="font-medium">#{String(o.id).slice(-8)} · {o.profiles?.full_name || o.full_name || "—"}</p>
//                 <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()} · {o.payment_method?.toUpperCase()}</p>
//                 {o.shipping_address && <p className="text-xs text-muted-foreground mt-1">{o.shipping_address}</p>}
//                 {o.phone && <p className="text-xs text-muted-foreground">Phone: {o.phone}</p>}
//               </div>
//               <div className="text-right">
//                 <Badge className={getStatusClassName(o.status)}>{o.status}</Badge>
//                 <p className="mt-1 font-semibold">{formatNPR(o.total_npr)}</p>
//                 <div className="flex gap-1 mt-2 justify-end">
//                   <Button
//                     variant="ghost"
//                     size="sm"
//                     onClick={() => setViewOrder(o)}
//                     className="text-primary hover:text-primary"
//                   >
//                     <Eye className="w-4 h-4" />
//                   </Button>
//                   {['pending', 'awaiting_payment'].includes(o.status) && (
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       onClick={() => setDeleteId(o.id)}
//                       className="text-destructive hover:text-destructive"
//                     >
//                       <Trash2 className="w-4 h-4" />
//                     </Button>
//                   )}
//                 </div>
//               </div>
//             </div>
//             <div className="mt-3 text-sm space-y-2">
//               {o.order_items?.map((it: any) => (
//                 <Link 
//                   key={it.id || it.product_name} 
//                   to={`/product/${nameToSlug(it.product_name)}`}
//                   className="flex items-center gap-3 hover:bg-accent/50 rounded p-1 -m-1 transition-colors"
//                 >
//                   {it.product_image && (
//                     <div className="flex-shrink-0 w-12 h-12 rounded overflow-hidden bg-muted">
//                       <img
//                         src={it.product_image}
//                         alt={it.product_name}
//                         className="w-full h-full object-cover"
//                       />
//                     </div>
//                   )}
//                   <div className="flex justify-between flex-1 text-muted-foreground">
//                     <span className="hover:text-foreground transition-colors">{it.product_name} × {it.qty}{it.size ? ` (${it.size})` : ""}{it.color ? ` - ${it.color}` : ""}</span>
//                     <span>{formatNPR(it.price_npr * it.qty)}</span>
//                   </div>
//                 </Link>
//               ))}
//             </div>
//             <div className="mt-3 flex flex-wrap gap-1">
//               {STATUSES.map((s) => {
//                 const isCurrentStatus = o.status === s;
//                 const canTransition = canTransitionTo(o.status, s);
//                 const isDisabled = isCurrentStatus || !canTransition;
                
//                 return (
//                   <button 
//                     key={s} 
//                     disabled={isDisabled} 
//                     onClick={() => setStatus(o.id, s)}
//                     className={`text-xs px-2 py-1 rounded border ${
//                       isCurrentStatus 
//                         ? "bg-primary text-primary-foreground border-primary" 
//                         : isDisabled
//                         ? "border-border bg-muted text-muted-foreground cursor-not-allowed opacity-50"
//                         : "border-border hover:bg-accent"
//                     }`}
//                   >
//                     {s}
//                   </button>
//                 );
//               })}
//             </div>
//           </div>
//         ))}
//         {orders.length === 0 && <p className="text-muted-foreground">No orders yet.</p>}
//       </div>

//       {/* Delete / Reject confirmation — Dialog centres reliably on all screen sizes */}
//       <Dialog open={!!deleteId} onOpenChange={(open) => { if (!open) { setDeleteId(null); setDeleteLabel("delete"); } }}>
//         <DialogContent className="max-w-md">
//           <DialogHeader>
//             <DialogTitle>
//               {deleteLabel === "reject" ? "Reject & Cancel Order?" : "Delete Order?"}
//             </DialogTitle>
//             <DialogDescription className="text-sm text-muted-foreground rounded-lg bg-accent/40 px-4 py-3 border border-primary/10 mt-2">
//               {deleteLabel === "reject"
//                 ? "This will reject the payment and permanently cancel this order. The customer will need to re-order."
//                 : "Are you sure you want to delete this order? This action cannot be undone and will permanently remove the order from the database."}
//             </DialogDescription>
//           </DialogHeader>
//           <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-2">
//             <Button
//               variant="outline"
//               className="border-primary/30"
//               onClick={() => { setDeleteId(null); setDeleteLabel("delete"); }}
//             >
//               Cancel
//             </Button>
//             <Button
//               variant="destructive"
//               onClick={deleteOrder}
//             >
//               {deleteLabel === "reject" ? "Reject Order" : "Delete Order"}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       <Dialog open={!!viewOrder} onOpenChange={(open) => !open && setViewOrder(null)}>
//         <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
//           <DialogHeader>
//             <DialogTitle>Order Details</DialogTitle>
//           </DialogHeader>
//           {viewOrder && (
//             <div className="space-y-4">
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <p className="text-sm font-medium text-muted-foreground">Order ID</p>
//                   <p className="font-mono">#{String(viewOrder.id).slice(-8)}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm font-medium text-muted-foreground">Status</p>
//                   <Badge>{viewOrder.status}</Badge>
//                 </div>
//                 <div>
//                   <p className="text-sm font-medium text-muted-foreground">Date</p>
//                   <p>{new Date(viewOrder.created_at).toLocaleString()}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm font-medium text-muted-foreground">Total</p>
//                   <p className="font-semibold">{formatNPR(viewOrder.total_npr)}</p>
//                 </div>
//               </div>

//               <div className="border-t pt-4">
//                 <h3 className="font-semibold mb-3">Customer Information</h3>
//                 <div className="space-y-2 text-sm">
//                   <div className="flex items-start gap-2">
//                     <span className="font-bold text-foreground min-w-[70px]">Name:</span>
//                     <span className="font-semibold text-foreground">{viewOrder.full_name}</span>
//                   </div>
//                   <div className="flex items-start gap-2">
//                     <span className="font-bold text-foreground min-w-[70px]">Phone:</span>
//                     <span className="font-semibold text-foreground">{viewOrder.phone}</span>
//                   </div>
//                   {viewOrder.profiles?.email && (
//                     <div className="flex items-start gap-2">
//                       <span className="font-bold text-foreground min-w-[70px]">Email:</span>
//                       <span className="font-semibold text-foreground">{viewOrder.profiles.email}</span>
//                     </div>
//                   )}
//                   <div className="flex items-start gap-2">
//                     <span className="font-bold text-foreground min-w-[70px]">Address:</span>
//                     <span className="font-semibold text-foreground">{viewOrder.shipping_address}</span>
//                   </div>
//                 </div>
//               </div>

//               <div className="border-t pt-4">
//                 <h3 className="font-semibold mb-3">Payment Information</h3>
//                 <div className="space-y-2 text-sm">
//                   <div className="flex items-start gap-2">
//                     <span className="font-bold text-foreground min-w-[130px]">Method:</span>
//                     <span className="font-semibold text-foreground">{viewOrder.payment_method?.toUpperCase()}</span>
//                   </div>
                  
//                   {/* PhonePay Payment Screenshot */}
//                   {viewOrder.payment_method === 'phonepay' && viewOrder.paymentScreenshot && (
//                     <div className="mt-3">
//                       <p className="font-bold text-foreground mb-2">Payment Screenshot:</p>
//                       <div
//                         className="border rounded-lg p-2 bg-muted/20 cursor-pointer group relative"
//                         onClick={() => setScreenshotPreview(viewOrder.paymentScreenshot)}
//                         title="Click to enlarge"
//                       >
//                         <img
//                           src={viewOrder.paymentScreenshot}
//                           alt="Payment screenshot"
//                           className="w-full max-h-48 object-contain rounded"
//                         />
//                         <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
//                           <ZoomIn className="w-8 h-8 text-white" />
//                         </div>
//                       </div>
//                       <p className="text-xs text-muted-foreground mt-1 text-center">Click to view full size</p>

//                       {/* Approve/Reject Buttons for awaiting_payment status */}
//                       {viewOrder.status === 'awaiting_payment' && (
//                         <div className="flex gap-2 mt-3">
//                           <Button
//                             onClick={() => {
//                               setStatus(viewOrder.id, 'confirmed');
//                               setViewOrder(null);
//                             }}
//                             className="flex-1"
//                           >
//                             Approve Payment
//                           </Button>
//                           <Button
//                             variant="destructive"
//                             onClick={() => {
//                               setDeleteLabel("reject");
//                               const oid = viewOrder.id;
//                               setViewOrder(null); // close detail dialog first
//                               // wait one tick so the Dialog's transform is fully gone
//                               // before the AlertDialog mounts with position:fixed
//                               setTimeout(() => setDeleteId(oid), 50);
//                             }}
//                             className="flex-1"
//                           >
//                             Reject &amp; Cancel Order
//                           </Button>
//                         </div>
//                       )}
//                     </div>
//                   )}
//                                     {viewOrder.paymentDetails?.transactionId && (
//                     <div className="flex items-start gap-2">
//                       <span className="font-bold text-foreground min-w-[130px]">Transaction ID:</span>
//                       <span className="font-mono text-sm">{viewOrder.paymentDetails.transactionId}</span>
//                     </div>
//                   )}
//                   {viewOrder.paymentDetails?.status && (
//                     <div className="flex items-start gap-2">
//                       <span className="font-bold text-foreground min-w-[130px]">Payment Status:</span>
//                       <span className="font-semibold text-foreground capitalize">{viewOrder.paymentDetails.status}</span>
//                     </div>
//                   )}
//                 </div>
//               </div>

//               <div className="border-t pt-4">
//                 <h3 className="font-semibold mb-3">Order Items</h3>
//                 <div className="space-y-3">
//                   {viewOrder.order_items?.map((item: any, idx: number) => (
//                     <Link 
//                       key={idx} 
//                       to={`/product/${nameToSlug(item.product_name)}`}
//                       className="flex gap-4 items-start pb-3 border-b last:border-b-0 last:pb-0 hover:bg-accent/30 rounded p-2 -m-2 transition-colors"
//                     >
//                       {/* Product Image */}
//                       {item.product_image && (
//                         <div className="flex-shrink-0 w-20 h-20 rounded-md overflow-hidden bg-muted">
//                           <img
//                             src={item.product_image}
//                             alt={item.product_name}
//                             className="w-full h-full object-cover"
//                           />
//                         </div>
//                       )}
                      
//                       {/* Product Details */}
//                       <div className="flex-1 min-w-0">
//                         <p className="font-semibold text-base hover:text-primary transition-colors">{item.product_name}</p>
//                         {item.category_name && (
//                           <p className="text-xs text-muted-foreground uppercase tracking-wide mt-0.5">{item.category_name}</p>
//                         )}
//                         <div className="text-sm text-muted-foreground space-y-1 mt-1.5">
//                           {item.size && <p>Size: <span className="font-medium">{item.size}</span></p>}
//                           {item.color && <p>Color: <span className="font-medium">{item.color}</span></p>}
//                           <p>Quantity: <span className="font-medium">{item.qty}</span></p>
//                           <p>Price: <span className="font-medium">{formatNPR(item.price_npr)}</span> each</p>
//                         </div>
//                       </div>
                      
//                       {/* Item Total */}
//                       <div className="flex-shrink-0 text-right">
//                         <p className="font-bold text-base">{formatNPR(item.price_npr * item.qty)}</p>
//                       </div>
//                     </Link>
//                   ))}
//                 </div>
//               </div>

//               {viewOrder.notes && (
//                 <div className="border-t pt-4">
//                   <div className="flex items-center justify-between mb-2">
//                     <h3 className="font-semibold">Order Notes</h3>
//                     {!['cancelled', 'delivered', 'shipped'].includes(viewOrder.status) && (
//                       <Button
//                         variant="destructive"
//                         size="sm"
//                         onClick={() => {
//                           setCancelId(viewOrder.id);
//                           setViewOrder(null);
//                         }}
//                       >
//                         <Ban className="w-4 h-4 mr-1" />
//                         Cancel Order
//                       </Button>
//                     )}
//                   </div>
//                   <p className="text-sm text-muted-foreground">{viewOrder.notes}</p>
//                 </div>
//               )}
              
//               {/* Show cancel button even if there are no notes */}
//               {!viewOrder.notes && !['cancelled', 'delivered', 'shipped'].includes(viewOrder.status) && (
//                 <div className="border-t pt-4 flex justify-end">
//                   <Button
//                     variant="destructive"
//                     size="sm"
//                     onClick={() => {
//                       setCancelId(viewOrder.id);
//                       setViewOrder(null);
//                     }}
//                   >
//                     <Ban className="w-4 h-4 mr-1" />
//                     Cancel Order
//                   </Button>
//                 </div>
//               )}
//             </div>
//           )}
//         </DialogContent>
//       </Dialog>
//       {/* Screenshot fullscreen preview */}
//       <Dialog open={!!screenshotPreview} onOpenChange={(open) => !open && setScreenshotPreview(null)}>
//         <DialogContent className="max-w-3xl">
//           <DialogHeader>
//             <DialogTitle>Payment Screenshot</DialogTitle>
//           </DialogHeader>
//           {screenshotPreview && (
//             <div className="flex flex-col items-center gap-4">
//               <img
//                 src={screenshotPreview}
//                 alt="Payment screenshot"
//                 className="w-full max-h-[70vh] object-contain rounded-lg border"
//               />
//               <a
//                 href={screenshotPreview}
//                 download="payment-screenshot.png"
//                 className="text-xs text-primary hover:underline"
//               >
//                 Download image
//               </a>
//             </div>
//           )}
//         </DialogContent>
//       </Dialog>

//       {/* Cancel Order Dialog */}
//       <Dialog open={!!cancelId} onOpenChange={(open) => { 
//         if (!open) { 
//           setCancelId(null); 
//           setCancelReason(""); 
//         } 
//       }}>
//         <DialogContent className="max-w-md">
//           <DialogHeader>
//             <DialogTitle>Cancel Order</DialogTitle>
//             <DialogDescription className="text-sm text-muted-foreground mt-2">
//               Please select a reason for cancelling this order. The customer will be notified and any confirmed stock will be restored.
//             </DialogDescription>
//           </DialogHeader>
//           <div className="space-y-4 py-4">
//             <div className="space-y-2">
//               <label className="text-sm font-medium">Cancellation Reason</label>
//               <Select value={cancelReason} onValueChange={setCancelReason}>
//                 <SelectTrigger>
//                   <SelectValue placeholder="Select a reason..." />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {CANCELLATION_REASONS.map((reason) => (
//                     <SelectItem key={reason} value={reason}>
//                       {reason}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>
//           </div>
//           <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
//             <Button
//               variant="outline"
//               onClick={() => { 
//                 setCancelId(null); 
//                 setCancelReason(""); 
//               }}
//             >
//               Go Back
//             </Button>
//             <Button
//               variant="destructive"
//               onClick={cancelOrder}
//               disabled={!cancelReason}
//             >
//               Cancel Order
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// };

// export default AdminOrders;


import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatNPR } from "@/hooks/useCart";
import { toast } from "sonner";
import { Trash2, Eye, ZoomIn, X, Ban } from "lucide-react";

// Helper function to convert product name to slug
const nameToSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Helper function to get custom badge className for pink
const getStatusClassName = (status: string): string => {
  if (['confirmed', 'shipped', 'delivered'].includes(status)) {
    return 'bg-pink-100 text-pink-700 hover:bg-pink-100 border-pink-200';
  }
  return '';
};

const STATUSES = ["pending", "confirmed", "shipped", "delivered"] as const;
type OrderStatus = typeof STATUSES[number];

// Define which statuses can transition to which
const canTransitionTo = (currentStatus: string, targetStatus: OrderStatus): boolean => {
  // Cancelled (or any other terminal state) orders are locked — no further transitions
  if (currentStatus === 'cancelled') {
    return false;
  }

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
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState<any[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLabel, setDeleteLabel] = useState<"delete" | "reject">("delete");
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState<string>("");
  const [viewOrder, setViewOrder] = useState<any | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  
  const load = () => api.get<any[]>("/admin/orders").then(setOrders).catch(() => {});
  
  useEffect(() => { 
    load(); 
  }, []);

  // Auto-open order if orderId is in URL params
  useEffect(() => {
    const orderId = searchParams.get('orderId');
    if (orderId && orders.length > 0) {
      const order = orders.find(o => o.id === orderId || String(o.id).slice(-8) === orderId.slice(-8));
      if (order) {
        setViewOrder(order);
        // Remove orderId from URL after opening
        setSearchParams({});
      }
    }
  }, [orders, searchParams, setSearchParams]);

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
      toast.success(deleteLabel === "reject" ? "Order rejected and deleted" : "Order deleted successfully");
      setDeleteId(null);
      setViewOrder(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const cancelOrder = async () => {
    if (!cancelId || !cancelReason) {
      toast.error("Please select a cancellation reason");
      return;
    }
    try {
      await api.post(`/admin/orders/${cancelId}/cancel`, { reason: cancelReason });
      toast.success("Order cancelled successfully");
      setCancelId(null);
      setCancelReason("");
      setViewOrder(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cancel failed");
    }
  };

  const CANCELLATION_REASONS = [
    "Item out of stock",
    "Delay in delivery/receiving product",
    "Customer request",
    "Payment issue",
    "Address verification failed",
    "Other operational issues"
  ];

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
                <Badge className={getStatusClassName(o.status)}>{o.status}</Badge>
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
            <div className="mt-3 text-sm space-y-2">
              {o.order_items?.map((it: any) => (
                <Link 
                  key={it.id || it.product_name} 
                  to={`/product/${nameToSlug(it.product_name)}`}
                  className="flex items-center gap-3 hover:bg-accent/50 rounded p-1 -m-1 transition-colors"
                >
                  {it.product_image && (
                    <div className="flex-shrink-0 w-12 h-12 rounded overflow-hidden bg-muted">
                      <img
                        src={it.product_image}
                        alt={it.product_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex justify-between flex-1 text-muted-foreground">
                    <span className="hover:text-foreground transition-colors">{it.product_name} × {it.qty}{it.size ? ` (${it.size})` : ""}{it.color ? ` - ${it.color}` : ""}</span>
                    <span>{formatNPR(it.price_npr * it.qty)}</span>
                  </div>
                </Link>
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
              {o.status === 'cancelled' && (
                <span className="text-xs px-2 py-1 rounded border border-destructive/30 bg-destructive/10 text-destructive">
                  Cancelled
                </span>
              )}
            </div>
          </div>
        ))}
        {orders.length === 0 && <p className="text-muted-foreground">No orders yet.</p>}
      </div>

      {/* Delete / Reject confirmation — Dialog centres reliably on all screen sizes */}
      <Dialog open={!!deleteId} onOpenChange={(open) => { if (!open) { setDeleteId(null); setDeleteLabel("delete"); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {deleteLabel === "reject" ? "Reject & Cancel Order?" : "Delete Order?"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground rounded-lg bg-accent/40 px-4 py-3 border border-primary/10 mt-2">
              {deleteLabel === "reject"
                ? "This will reject the payment and permanently cancel this order. The customer will need to re-order."
                : "Are you sure you want to delete this order? This action cannot be undone and will permanently remove the order from the database."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-2">
            <Button
              variant="outline"
              className="border-primary/30"
              onClick={() => { setDeleteId(null); setDeleteLabel("delete"); }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteOrder}
            >
              {deleteLabel === "reject" ? "Reject Order" : "Delete Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                <h3 className="font-semibold mb-3">Customer Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-foreground min-w-[70px]">Name:</span>
                    <span className="font-semibold text-foreground">{viewOrder.full_name}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-foreground min-w-[70px]">Phone:</span>
                    <span className="font-semibold text-foreground">{viewOrder.phone}</span>
                  </div>
                  {viewOrder.profiles?.email && (
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-foreground min-w-[70px]">Email:</span>
                      <span className="font-semibold text-foreground">{viewOrder.profiles.email}</span>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-foreground min-w-[70px]">Address:</span>
                    <span className="font-semibold text-foreground">{viewOrder.shipping_address}</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Payment Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-foreground min-w-[130px]">Method:</span>
                    <span className="font-semibold text-foreground">{viewOrder.payment_method?.toUpperCase()}</span>
                  </div>
                  
                  {/* PhonePay Payment Screenshot */}
                  {viewOrder.payment_method === 'phonepay' && viewOrder.paymentScreenshot && (
                    <div className="mt-3">
                      <p className="font-bold text-foreground mb-2">Payment Screenshot:</p>
                      <div
                        className="border rounded-lg p-2 bg-muted/20 cursor-pointer group relative"
                        onClick={() => setScreenshotPreview(viewOrder.paymentScreenshot)}
                        title="Click to enlarge"
                      >
                        <img
                          src={viewOrder.paymentScreenshot}
                          alt="Payment screenshot"
                          className="w-full max-h-48 object-contain rounded"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                          <ZoomIn className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 text-center">Click to view full size</p>

                      {/* Approve/Reject Buttons for awaiting_payment status */}
                      {viewOrder.status === 'awaiting_payment' && (
                        <div className="flex gap-2 mt-3">
                          <Button
                            onClick={() => {
                              setStatus(viewOrder.id, 'confirmed');
                              setViewOrder(null);
                            }}
                            className="flex-1"
                          >
                            Approve Payment
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => {
                              setDeleteLabel("reject");
                              const oid = viewOrder.id;
                              setViewOrder(null); // close detail dialog first
                              // wait one tick so the Dialog's transform is fully gone
                              // before the AlertDialog mounts with position:fixed
                              setTimeout(() => setDeleteId(oid), 50);
                            }}
                            className="flex-1"
                          >
                            Reject &amp; Cancel Order
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                                    {viewOrder.paymentDetails?.transactionId && (
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-foreground min-w-[130px]">Transaction ID:</span>
                      <span className="font-mono text-sm">{viewOrder.paymentDetails.transactionId}</span>
                    </div>
                  )}
                  {viewOrder.paymentDetails?.status && (
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-foreground min-w-[130px]">Payment Status:</span>
                      <span className="font-semibold text-foreground capitalize">{viewOrder.paymentDetails.status}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Order Items</h3>
                <div className="space-y-3">
                  {viewOrder.order_items?.map((item: any, idx: number) => (
                    <Link 
                      key={idx} 
                      to={`/product/${nameToSlug(item.product_name)}`}
                      className="flex gap-4 items-start pb-3 border-b last:border-b-0 last:pb-0 hover:bg-accent/30 rounded p-2 -m-2 transition-colors"
                    >
                      {/* Product Image */}
                      {item.product_image && (
                        <div className="flex-shrink-0 w-20 h-20 rounded-md overflow-hidden bg-muted">
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base hover:text-primary transition-colors">{item.product_name}</p>
                        {item.category_name && (
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mt-0.5">{item.category_name}</p>
                        )}
                        <div className="text-sm text-muted-foreground space-y-1 mt-1.5">
                          {item.size && <p>Size: <span className="font-medium">{item.size}</span></p>}
                          {item.color && <p>Color: <span className="font-medium">{item.color}</span></p>}
                          <p>Quantity: <span className="font-medium">{item.qty}</span></p>
                          <p>Price: <span className="font-medium">{formatNPR(item.price_npr)}</span> each</p>
                        </div>
                      </div>
                      
                      {/* Item Total */}
                      <div className="flex-shrink-0 text-right">
                        <p className="font-bold text-base">{formatNPR(item.price_npr * item.qty)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {viewOrder.notes && (
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Order Notes</h3>
                    {!['cancelled', 'delivered', 'shipped'].includes(viewOrder.status) && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setCancelId(viewOrder.id);
                          setViewOrder(null);
                        }}
                      >
                        <Ban className="w-4 h-4 mr-1" />
                        Cancel Order
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{viewOrder.notes}</p>
                </div>
              )}
              
              {/* Show cancel button even if there are no notes */}
              {!viewOrder.notes && !['cancelled', 'delivered', 'shipped'].includes(viewOrder.status) && (
                <div className="border-t pt-4 flex justify-end">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setCancelId(viewOrder.id);
                      setViewOrder(null);
                    }}
                  >
                    <Ban className="w-4 h-4 mr-1" />
                    Cancel Order
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Screenshot fullscreen preview */}
      <Dialog open={!!screenshotPreview} onOpenChange={(open) => !open && setScreenshotPreview(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Payment Screenshot</DialogTitle>
          </DialogHeader>
          {screenshotPreview && (
            <div className="flex flex-col items-center gap-4">
              <img
                src={screenshotPreview}
                alt="Payment screenshot"
                className="w-full max-h-[70vh] object-contain rounded-lg border"
              />
              <a
                href={screenshotPreview}
                download="payment-screenshot.png"
                className="text-xs text-primary hover:underline"
              >
                Download image
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Order Dialog */}
      <Dialog open={!!cancelId} onOpenChange={(open) => { 
        if (!open) { 
          setCancelId(null); 
          setCancelReason(""); 
        } 
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-2">
              Please select a reason for cancelling this order. The customer will be notified and any confirmed stock will be restored.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Cancellation Reason</label>
              <Select value={cancelReason} onValueChange={setCancelReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason..." />
                </SelectTrigger>
                <SelectContent>
                  {CANCELLATION_REASONS.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => { 
                setCancelId(null); 
                setCancelReason(""); 
              }}
            >
              Go Back
            </Button>
            <Button
              variant="destructive"
              onClick={cancelOrder}
              disabled={!cancelReason}
            >
              Cancel Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;