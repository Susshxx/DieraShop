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
    <div className="px-4 sm:px-6 py-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Customer Reviews</h2>
          {stats.totalReviews > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-5 h-5 ${s <= Math.round(stats.averageRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {stats.averageRating.toFixed(1)} out of 5 ({stats.totalReviews} {stats.totalReviews === 1 ? "review" : "reviews"})
              </span>
            </div>
          )}
        </div>
        {canReview && (
          <Button onClick={() => setShowDialog(true)}>Write a Review</Button>
        )}
      </div>

      <div className="space-y-4">
        {reviews.map((r) => (
          <div key={r.id} className="border border-border rounded-lg p-4 bg-card">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-medium">{r.user_name}</p>
                <div className="flex mt-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${s <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                    />
                  ))}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(r.created_at).toLocaleDateString()}
                {r.verified && <span className="ml-2 text-green-600">✓ Verified Purchase</span>}
              </div>
            </div>
            <p className="text-sm mt-2">{r.comment}</p>
            {r.images && r.images.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {r.images.map((img: string, idx: number) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`Review image ${idx + 1}`}
                    className="w-20 h-20 object-cover rounded cursor-pointer hover:opacity-80"
                    onClick={() => setEnlargedImage(img)}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
        {reviews.length === 0 && (
          <p className="text-muted-foreground text-center py-8">No reviews yet. Be the first to review this product!</p>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Write Your Review</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="mt-2 block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:opacity-90"
                disabled={images.length >= 5}
              />
              {images.length > 0 && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative">
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
