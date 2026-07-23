import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import DieraHeader from "@/components/header/DieraHeader";
import Footer from "@/components/footer/Footer";
import { api } from "@/lib/api";
import ProductCard from "@/components/product/ProductCard";
import { SlidersHorizontal } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const ITEMS_PER_BATCH = 16;

// Robustly extract a numeric price from a product, regardless of whether
// the API returns it as a number, a numeric string, or a formatted string
// like "NPR 1,200.00". Non-numeric/missing values fall back to 0.
const getProductPrice = (product: any): number => {
  const raw = product?.priceNPR ?? product?.price_npr ?? product?.price ?? 0;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : 0;
  const cleaned = String(raw).replace(/[^0-9.-]/g, "");
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

const NewIn = () => {
  const [allItems, setAllItems] = useState<any[]>([]); // Raw, newest-first from API
  const [sortedItems, setSortedItems] = useState<any[]>([]); // Sorted per sortBy
  const [displayedItems, setDisplayedItems] = useState<any[]>([]); // Lazily-loaded subset actually rendered
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sortBy, setSortBy] = useState<string>("default");
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
  document.title = "New In - Diera Shop | Latest Arrivals";
}, []);


  // Keep a ref in sync with sortBy so the fetch effect (which only runs
  // once, on mount) can always sort with the CURRENT sort option instead
  // of the value it closed over at mount time.
  const sortByRef = useRef(sortBy);
  useEffect(() => {
    sortByRef.current = sortBy;
  }, [sortBy]);

  // Sort items based on the selected option. "default" keeps the
  // newest-first order the items already arrive in.
  const sortItems = useCallback((items: any[], sortOption: string) => {
    if (!items || items.length === 0) return [];

    const sorted = [...items];

    switch (sortOption) {
      case "price-low-high":
        return sorted.sort((a, b) => getProductPrice(a) - getProductPrice(b));

      case "price-high-low":
        return sorted.sort((a, b) => getProductPrice(b) - getProductPrice(a));

      case "best-sellers":
        return sorted.sort((a, b) => {
          const getStockLevel = (product: any) => {
            if (product.variantStock && typeof product.variantStock === 'object') {
              return Object.values(product.variantStock).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0);
            }
            return product.stock || 0;
          };
          return getStockLevel(a) - getStockLevel(b);
        });

      default:
        return sorted;
    }
  }, []);

  // Apply sorting whenever sortBy or the underlying item list changes,
  // and reset the lazily-displayed batch back to the first page.
  useEffect(() => {
    if (allItems.length > 0) {
      const sorted = sortItems(allItems, sortBy);
      setSortedItems(sorted);
      setDisplayedItems(sorted.slice(0, ITEMS_PER_BATCH));
    } else {
      setSortedItems([]);
      setDisplayedItems([]);
    }
  }, [sortBy, allItems, sortItems]);

  // Lazily reveal the next batch of already-fetched items. This doesn't
  // hit the network again - it just grows how much of the already-loaded
  // data we render, which is what keeps this "lazy" and light on data use.
  const loadMoreItems = useCallback(() => {
    if (loadingMore || displayedItems.length >= sortedItems.length) return;

    setLoadingMore(true);
    const nextBatch = sortedItems.slice(displayedItems.length, displayedItems.length + ITEMS_PER_BATCH);

    setTimeout(() => {
      setDisplayedItems(prev => [...prev, ...nextBatch]);
      setLoadingMore(false);
    }, 100);
  }, [sortedItems, displayedItems, loadingMore]);

  // Intersection Observer to trigger loadMoreItems as the user scrolls
  // near the bottom, instead of a numbered pagination control.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && sortedItems.length > 0) {
          loadMoreItems();
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [loadMoreItems, sortedItems]);

useEffect(() => {
    api.get<any[]>("/products?limit=200&populate=category")
      .then((products) => {
        // Filter products to only show those added in the last 7 days
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const newProducts = products.filter((product) => {
          const createdAt = product.created_at || product.createdAt;
          if (!createdAt) return false;
          const productDate = new Date(createdAt).getTime();
          return productDate >= sevenDaysAgo;
        });

        // Sort by newest first
        const sorted = [...newProducts].sort((a, b) => {
          const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
          const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
          return dateB - dateA;
        });
        setAllItems(sorted);

        // Also compute and show the currently-selected sort's first batch
        // right away, rather than waiting for the separate sort effect -
        // guarantees products always appear immediately instead of
        // depending on effect timing.
        const displaySorted = sortItems(sorted, sortByRef.current);
        setSortedItems(displaySorted);
        setDisplayedItems(displaySorted.slice(0, ITEMS_PER_BATCH));

        setLoading(false); // hide spinner as soon as we have data
      })
      .catch((err) => {
        console.error('Failed to load new in products:', err);
        setLoading(false);
      });
  }, []);

  const totalItems = allItems.length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DieraHeader />
      <main className="flex-1 px-2 sm:px-3 py-3 max-w-[1600px] mx-auto w-full">
        <div className="flex flex-row items-center justify-between gap-2 mb-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-light mb-0.5">New In</h1>
            <p className="text-xs sm:text-xs text-muted-foreground">
              {loading ? 'Loading...' : `Showing ${displayedItems.length} of ${totalItems} items`}
            </p>
          </div>

          {/* Filter Icon Button */}
          {!loading && totalItems > 0 && (
            <button
              onClick={() => setFilterDialogOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-border hover:bg-accent transition-colors"
              aria-label="Filter products"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <p className="text-[10px] sm:text-xs text-muted-foreground">Loading latest products...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
              {displayedItems.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
              {displayedItems.length === 0 && (
                <div className="col-span-full text-center py-10">
                  <p className="text-[10px] sm:text-xs text-muted-foreground">No products available yet.</p>
                  <Link to="/" className="text-primary hover:underline text-[10px] sm:text-xs mt-2 inline-block">
                    Return to home
                  </Link>
                </div>
              )}
            </div>

            {/* Lazy-load trigger and indicator, replacing numbered pagination */}
            {displayedItems.length < sortedItems.length && (
              <div ref={observerTarget} className="flex justify-center mt-6">
                <div className="animate-pulse text-muted-foreground text-[10px] sm:text-xs">
                  Loading more products...
                </div>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />

      {/* Filter Dialog */}
      <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sort Products</DialogTitle>
          </DialogHeader>
          <RadioGroup value={sortBy} onValueChange={(value) => {
            setSortBy(value);
            setFilterDialogOpen(false);
          }}>
            <div className="space-y-3 py-4">
              <div className="flex items-center space-x-3 cursor-pointer hover:bg-accent p-2 rounded">
                <RadioGroupItem value="default" id="default" />
                <Label htmlFor="default" className="cursor-pointer flex-1">Default (Newest First)</Label>
              </div>
              <div className="flex items-center space-x-3 cursor-pointer hover:bg-accent p-2 rounded">
                <RadioGroupItem value="price-low-high" id="price-low-high" />
                <Label htmlFor="price-low-high" className="cursor-pointer flex-1">Price: Low to High</Label>
              </div>
              <div className="flex items-center space-x-3 cursor-pointer hover:bg-accent p-2 rounded">
                <RadioGroupItem value="price-high-low" id="price-high-low" />
                <Label htmlFor="price-high-low" className="cursor-pointer flex-1">Price: High to Low</Label>
              </div>
              <div className="flex items-center space-x-3 cursor-pointer hover:bg-accent p-2 rounded">
                <RadioGroupItem value="best-sellers" id="best-sellers" />
                <Label htmlFor="best-sellers" className="cursor-pointer flex-1">Best Sellers</Label>
              </div>
            </div>
          </RadioGroup>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewIn;