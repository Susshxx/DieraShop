import { useEffect, useState, useRef, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import DieraHeader from "@/components/header/DieraHeader";
import Footer from "@/components/footer/Footer";
import { api } from "@/lib/api";
import ProductCard from "@/components/product/ProductCard";
import { SlidersHorizontal } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { loadWithCache, CACHE_KEYS } from "@/lib/productCache";

const ITEMS_PER_BATCH = 16;

const getProductPrice = (product: any): number => {
  const raw = product?.priceNPR ?? product?.price_npr ?? product?.price ?? 0;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : 0;
  const cleaned = String(raw).replace(/[^0-9.-]/g, "");
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

const Category = () => {
  const { category } = useParams();
  const [cat, setCat] = useState<any>(null);
  const [allItems, setAllItems] = useState<any[]>([]); // Raw, unsorted from API
  const [sortedItems, setSortedItems] = useState<any[]>([]); // Sorted per sortBy
  const [displayedItems, setDisplayedItems] = useState<any[]>([]); // Lazily-loaded subset actually rendered
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sortBy, setSortBy] = useState<string>("default");
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Keep a ref in sync with sortBy so the fetch effect can always sort
  // with the CURRENT sort option instead of the value it closed over
  // when the effect was set up.
  const sortByRef = useRef(sortBy);
  useEffect(() => {
    sortByRef.current = sortBy;
  }, [sortBy]);

  // Sort items based on the selected option.
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

  // Lazily reveal the next batch of already-fetched items rather than
  // hitting the network again.
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
    if (!category) return;

    setLoading(true);
    // Reset sort back to default whenever the category itself changes,
    // and reset the item lists so the previous category's products don't
    // flash while the new category loads.
    setSortBy("default");
    setAllItems([]);
    setSortedItems([]);
    setDisplayedItems([]);

    // Fetch (or cache-hit) category meta
    const catCacheKey = `diera-cat-meta-${category}`;
    loadWithCache<any>(
      catCacheKey,
      () => api.get<any>(`/categories/slug/${category}`),
      (catData) => setCat(catData)
    );

    // Fetch (or cache-hit) products for this category slug
    loadWithCache<any[]>(
      CACHE_KEYS.categoryProducts(category),
      async () => {
        const catData = await api.get<any>(`/categories/slug/${category}`);
        return api.get<any[]>(`/products?categoryId=${catData.id}&populate=category`);
      },
      (products) => {
        const items = products || [];
        setAllItems(items);

        // Also compute and show the currently-selected sort's first batch
        // right away, rather than waiting for the separate sort effect -
        // guarantees products always appear immediately instead of
        // depending on effect timing.
        const displaySorted = sortItems(items, sortByRef.current);
        setSortedItems(displaySorted);
        setDisplayedItems(displaySorted.slice(0, ITEMS_PER_BATCH));

        setLoading(false);
      }
    );
  }, [category, sortItems]);

  const totalItems = allItems.length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DieraHeader />
      <main className="flex-1 px-2 sm:px-3 py-3 max-w-[1600px] mx-auto w-full">
        <div className="flex flex-row items-center justify-between gap-2 mb-2">
          <div>
            <h1 className="text-2xl sm:text-2xl capitalize italic mb-0.5">{cat?.name || category}</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {loading ? 'Loading...' : `Showing ${displayedItems.length} of ${totalItems} items`}
            </p>
          </div>

          {/* Filter Icon Button - right hand side */}
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
            <p className="text-[10px] sm:text-xs text-muted-foreground">Loading products...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
              {displayedItems.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
              {displayedItems.length === 0 && (
                <p className="col-span-full text-muted-foreground text-xs py-6 text-center">No products yet.</p>
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
                <Label htmlFor="default" className="cursor-pointer flex-1">Default</Label>
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

export default Category;