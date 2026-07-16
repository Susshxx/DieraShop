import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { formatNPR } from "@/hooks/useCart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { X } from "lucide-react";

// Helper function to convert product name to slug
const nameToSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const Orders = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState<any[]>([]);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [reviewDialog, setReviewDialog] = useState<{ productId: string; orderId: string; productName: string; existingReview?: any } | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [viewOrder, setViewOrder] = useState<any | null>(null);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const loadOrders = () => {
    if (!user) return;
    api.get<any[]>("/orders/mine").then(setOrders).catch(() => {});
  };

  useEffect(() => {
    loadOrders();
  }, [user]);

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

  const cancelOrder = async () => {
    if (!cancelId) return;
    try {
      await api.delete(`/orders/${cancelId}`);
      toast.success("Order cancelled successfully");
      setCancelId(null);
      setViewOrder(null);
      loadOrders();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel order");
    }
  };

  const openReviewDialog = async (productId: string, orderId: string, productName: string) => {
    try {
      const existingReview = await api.get(`/reviews/user/${productId}`);
      if (existingReview) {
        setRating(existingReview.rating);
        setComment(existingReview.comment);
        setExistingImages(existingReview.images || []);
        setReviewDialog({ productId, orderId, productName, existingReview });
      } else {
        setRating(5);
        setComment("");
        setExistingImages([]);
        setReviewDialog({ productId, orderId, productName });
      }
    } catch {
      setRating(5);
      setComment("");
      setExistingImages([]);
      setReviewDialog({ productId, orderId, productName });
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewDialog || !comment.trim()) {
      toast.error("Please write a comment");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("productId", reviewDialog.productId);
      fd.append("orderId", reviewDialog.orderId);
      fd.append("rating", String(rating));
      fd.append("comment", comment);
      fd.append("existingImages", JSON.stringify(existingImages));
      
      images.forEach((img) => {
        fd.append("images", img);
      });

      if (reviewDialog.existingReview) {
        await api.put(`/reviews/${reviewDialog.existingReview.id}`, fd);
        toast.success("Review updated successfully!");
      } else {
        await api.post("/reviews", fd);
        toast.success("Review posted successfully!");
      }
      
      setReviewDialog(null);
      setComment("");
      setRating(5);
      setImages([]);
      setExistingImages([]);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((f) => f.type.startsWith("image/") && f.size <= 5 * 1024 * 1024);
    
    if (validFiles.length < files.length) {
      toast.error("Some images were too large (max 5MB) or invalid");
    }
    
    const totalImages = existingImages.length + images.length + validFiles.length;
    if (totalImages > 5) {
      toast.error("Maximum 5 images allowed");
      return;
    }
    
    setImages((prev) => [...prev, ...validFiles]);
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Helper function to get status display text
  const getStatusText = (status: string) => {
    if (status === 'awaiting_payment') return 'pending';
    return status;
  };

  // Helper function to get status badge variant
  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    // We'll use a custom className for pink, so return secondary as base
    return 'secondary';
  };
  
  // Helper function to get custom badge className for pink
  const getStatusClassName = (status: string): string => {
    if (['confirmed', 'shipped', 'delivered'].includes(status)) {
      return 'bg-pink-100 text-pink-700 hover:bg-pink-100 border-pink-200';
    }
    return '';
  };

  // Helper to format full address - shipping_address already includes district, province from checkout
  const formatAddress = (address: string) => {
    if (!address) return '';
    // The address from checkout already includes: street, landmark, district, province, Nepal
    // Just ensure Nepal is at the end if not already there
    const addressLower = address.toLowerCase();
    if (!addressLower.includes('nepal')) {
      return `${address}, Nepal`;
    }
    return address;
  };

  if (orders.length === 0) return <p className="text-muted-foreground">You have no orders yet.</p>;

  return (
    <div className="space-y-4">
      {orders.map((o) => {
        // Calculate shipping charge (assuming it's included in total or fetched separately)
        const itemsTotal = o.order_items?.reduce((sum: number, it: any) => sum + (it.price_npr * it.qty), 0) || 0;
        const shippingCharge = o.total_npr - itemsTotal;
        
        return (
          <div key={o.id} className="border border-border rounded-lg p-3 sm:p-4 bg-card">
            {/* Header: Order info on left, Product summary on right */}
            <div className="flex justify-between items-start gap-4 mb-2">
              {/* Left: Order # and timestamp */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-base text-foreground">Order #{String(o.id).slice(-8)}</p>
                <p className="text-xs text-foreground mt-0.5">{new Date(o.created_at).toLocaleString()}</p>
              </div>
              
              {/* Right: First product name and total price */}
              <div className="flex flex-col items-end flex-shrink-0">
                {o.order_items && o.order_items.length > 0 && (
                  <p className="text-sm font-medium text-foreground text-right line-clamp-1">
                    {o.order_items[0].product_name}
                    {o.order_items.length > 1 && ` +${o.order_items.length - 1} more`}
                  </p>
                )}
                <p className="text-lg sm:text-xl font-bold text-foreground mt-1">{formatNPR(o.total_npr)}</p>
              </div>
            </div>

            {/* Status badge and Address */}
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={getStatusVariant(o.status)} className={getStatusClassName(o.status)}>{getStatusText(o.status)}</Badge>
            </div>
            <div className="mb-2">
              <p className="text-xs text-foreground leading-relaxed">{formatAddress(o.shipping_address)}</p>
            </div>

            {/* Shipping Charge */}
            {shippingCharge > 0 && (
              <div className="mb-2 pb-2 border-b border-border">
                <p className="text-sm text-foreground">
                  <span className="text-muted-foreground">Shipping Charge:</span> <span className="font-semibold">{formatNPR(shippingCharge)}</span>
                </p>
              </div>
            )}

            {/* Product Items */}
            <div className="space-y-2 mt-2">
              {o.order_items?.map((it: any) => (
                <Link
                  key={it.id || it.product_name}
                  to={`/product/${nameToSlug(it.product_name)}`}
                  className="flex items-center gap-3 hover:bg-accent/50 rounded p-2 transition-colors"
                >
                  {/* Product Image */}
                  {it.product_image && (
                    <div className="flex-shrink-0 w-16 h-16 sm:w-14 sm:h-14 rounded overflow-hidden bg-muted">
                      <img
                        src={it.product_image}
                        alt={it.product_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground hover:text-primary transition-colors line-clamp-2">{it.product_name}</p>
                    {it.color && <p className="text-xs text-foreground mt-0.5">Color: {it.color}</p>}
                    {it.size && <p className="text-xs text-foreground">Size: {it.size}</p>}
                    {o.status === 'delivered' && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          openReviewDialog(it.product_id, o.id, it.product_name);
                        }}
                        className="h-auto p-0 text-xs text-primary mt-1"
                      >
                        Write Review
                      </Button>
                    )}
                  </div>
                  
                  {/* Quantity and Price */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm text-foreground font-medium">x {it.qty}</p>
                    <p className="text-base font-semibold text-foreground">{formatNPR(it.price_npr * it.qty)}</p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Footer: Payment Method and Actions */}
            <div className="mt-3 pt-2 border-t border-border flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <p className="text-xs text-foreground">
                Payment: <span className="font-medium">{o.payment_method?.toUpperCase()}</span>
              </p>
              {['pending', 'awaiting_payment'].includes(o.status) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCancelId(o.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-full sm:w-auto"
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel Order
                </Button>
              )}
            </div>
          </div>
        );
      })}

      {/* Cancel confirmation — uses Dialog (reliable centering) instead of AlertDialog */}
      <Dialog open={!!cancelId} onOpenChange={(open) => !open && setCancelId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Order?</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground rounded-lg bg-accent/40 px-4 py-3 border border-primary/10 mt-2">
              Are you sure you want to cancel this order? This action cannot be undone. You can only cancel orders that are pending or awaiting payment.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-2">
            <Button variant="outline" onClick={() => setCancelId(null)} className="border-primary/30">
              Keep Order
            </Button>
            <Button
              variant="destructive"
              onClick={cancelOrder}
            >
              Cancel Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!reviewDialog} onOpenChange={(open) => !open && setReviewDialog(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{reviewDialog?.existingReview ? "Edit Your Review" : "Write Your Review"}</DialogTitle>
            <p className="text-sm text-muted-foreground">{reviewDialog?.productName}</p>
          </DialogHeader>
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Rating</label>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 ${s <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} hover:text-yellow-400 transition`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="comment" className="text-sm font-medium">
                Your Review
              </label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with this product..."
                className="mt-2"
                rows={4}
                maxLength={1000}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Photos (Optional, max 5)</label>
              {(existingImages.length + images.length) < 5 && (
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="mt-2 block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:opacity-90"
                />
              )}
              {(existingImages.length > 0 || images.length > 0) && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {existingImages.map((img, idx) => (
                    <div key={`existing-${idx}`} className="relative">
                      <img
                        src={img}
                        alt={`Existing ${idx + 1}`}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(idx)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {images.map((img, idx) => (
                    <div key={`new-${idx}`} className="relative">
                      <img
                        src={URL.createObjectURL(img)}
                        alt={`Preview ${idx + 1}`}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Submitting..." : reviewDialog?.existingReview ? "Update Review" : "Post Review"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;
