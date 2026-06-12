import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { toast } from "sonner";

interface Props {
  productId: string;
}

const ProductReviews = ({ productId }: Props) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [canReview, setCanReview] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ averageRating: 0, totalReviews: 0 });
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

  const loadReviews = () => {
    api.get<any[]>(`/reviews/product/${productId}`).then(setReviews).catch(() => {});
    api.get<any>(`/reviews/product/${productId}/stats`).then(setStats).catch(() => {});
  };

  useEffect(() => {
    loadReviews();
    if (user && user.role !== 'admin') {
      api.get<any>(`/reviews/can-review/${productId}`)
        .then((data) => {
          setCanReview(data.canReview);
          setOrderId(data.orderId);
        })
        .catch(() => {});
    }
  }, [productId, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error("Please write a comment");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("productId", productId);
      fd.append("orderId", orderId!);
      fd.append("rating", String(rating));
      fd.append("comment", comment);
      
      images.forEach((img) => {
        fd.append("images", img);
      });

      await api.post("/reviews", fd);
      toast.success("Review posted successfully!");
      setShowDialog(false);
      setComment("");
      setRating(5);
      setImages([]);
      setCanReview(false);
      loadReviews();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to post review");
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
    
    setImages((prev) => [...prev, ...validFiles].slice(0, 5));
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium">Customer Reviews</h2>
          {stats.totalReviews > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-3 h-3 ${s <= Math.round(stats.averageRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {stats.averageRating.toFixed(1)} ({stats.totalReviews})
              </span>
            </div>
          )}
        </div>
        {canReview && (
          <Button size="sm" onClick={() => setShowDialog(true)}>Write Review</Button>
        )}
      </div>

      <div className="space-y-2">
        {reviews.map((r) => (
          <div key={r.id} className="border border-border rounded p-3 bg-card">
            <div className="flex justify-between items-start mb-1">
              <div>
                <p className="text-xs font-medium">{r.user_name}</p>
                <div className="flex mt-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3 h-3 ${s <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                    />
                  ))}
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground text-right">
                {new Date(r.created_at).toLocaleDateString()}
                {r.verified && <span className="ml-1 text-green-600">✓</span>}
              </div>
            </div>
            <p className="text-xs mt-1">{r.comment}</p>
            {r.images && r.images.length > 0 && (
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {r.images.map((img: string, idx: number) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`Review ${idx + 1}`}
                    className="w-14 h-14 object-cover rounded cursor-pointer hover:opacity-80"
                    onClick={() => setEnlargedImage(img)}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
        {reviews.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">No reviews yet.</p>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base">Write Your Review</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-medium">Rating</label>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-6 h-6 ${s <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} hover:text-yellow-400 transition`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="comment" className="text-xs font-medium">
                Your Review
              </label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience..."
                className="mt-1 text-xs"
                rows={3}
                maxLength={1000}
              />
            </div>
            <div>
              <label className="text-xs font-medium">Photos (Optional, max 5)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="mt-1 block w-full text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:opacity-90"
                disabled={images.length >= 5}
              />
              {images.length > 0 && (
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative">
                      <img
                        src={URL.createObjectURL(img)}
                        alt={`Preview ${idx + 1}`}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button type="submit" disabled={loading} className="w-full" size="sm">
              {loading ? "Posting..." : "Post Review"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!enlargedImage} onOpenChange={(open) => !open && setEnlargedImage(null)}>
        <DialogContent className="max-w-4xl">
          {enlargedImage && (
            <img src={enlargedImage} alt="Enlarged view" className="w-full h-auto max-h-[80vh] object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductReviews;
