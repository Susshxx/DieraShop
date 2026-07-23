import { useEffect, useState, useRef, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import DieraHeader from "@/components/header/DieraHeader";
import Footer from "@/components/footer/Footer";
import { api } from "@/lib/api";
import { connectSocket } from "@/lib/socket";
import ProductCard from "@/components/product/ProductCard";
import { SlidersHorizontal } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

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

  // Set page title
  useEffect(() => {
    if (category) {
      document.title = `${category.charAt(0).toUpperCase() + category.slice(1)} - Diera Shop | Women's Fashion`;
    }
  }, [category]);
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
      // Show all items if total is less than batch size, otherwise show first batch
      const displayCount = Math.min(sorted.length, ITEMS_PER_BATCH);
      setDisplayedItems(sorted.slice(0, displayCount));
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

  const refreshCategoryProducts = useCallback(async () => {
    if (!category) return;
    
    console.log('[category] Refreshing category products for:', category);
    try {
      const catData = await api.get<any>(`/categories/slug/${category}`);
      setCat(catData);
      const products = await api.get<any[]>(`/products?categoryId=${catData.id}&populate=category`);
      const items = products || [];
      console.log('[category] Refreshed', items.length, 'products');
      setAllItems(items);
      const displaySorted = sortItems(items, sortByRef.current);
      setSortedItems(displaySorted);
      const displayCount = Math.min(displaySorted.length, ITEMS_PER_BATCH);
      setDisplayedItems(displaySorted.slice(0, displayCount));
    } catch (err) {
      console.error('Failed to refresh category products:', err);
    }
  }, [category, sortItems]);

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

    // Fetch category by slug
    api.get<any>(`/categories/slug/${category}`)
      .then((catData) => {
        setCat(catData);
        // Fetch products for this category
        return api.get<any[]>(`/products?categoryId=${catData.id}&populate=category`);
      })
      .then((products) => {
        const items = products || [];
        setAllItems(items);
        // Also compute and show the currently-selected sort's first batch
        // right away, rather than waiting for the separate sort effect -
        // guarantees products always appear immediately instead of
        // depending on effect timing.
        const displaySorted = sortItems(items, sortByRef.current);
        setSortedItems(displaySorted);
        // Show all items if total is less than batch size, otherwise show first batch
        const displayCount = Math.min(displaySorted.length, ITEMS_PER_BATCH);
        setDisplayedItems(displaySorted.slice(0, displayCount));
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load category or products:', err);
        setLoading(false);
      });

    // Set up WebSocket connection for real-time updates
    const socket = connectSocket();

    // Track if we received a socket message recently
    let lastSocketMessage = Date.now();

    socket.on('connect', () => {
      console.log('[socket] Connected for real-time updates');
    });

    socket.on('connect_error', (err) => {
      console.error('[socket] Connection error:', err);
    });

    socket.on('product:created', (data) => {
      console.log('[socket] Product created event received:', data);
      lastSocketMessage = Date.now();
      refreshCategoryProducts();
    });

    socket.on('product:updated', (data) => {
      console.log('[socket] Product updated event received:', data);
      lastSocketMessage = Date.now();
      refreshCategoryProducts();
    });

    socket.on('product:deleted', (data) => {
      console.log('[socket] Product deleted event received:', data);
      lastSocketMessage = Date.now();
      // Immediately remove from state for instant feedback
      if (data && data.id) {
        setAllItems(prev => prev.filter(p => p.id !== data.id));
        setSortedItems(prev => prev.filter(p => p.id !== data.id));
        setDisplayedItems(prev => prev.filter(p => p.id !== data.id));
      }
      // Also refresh from API to ensure consistency
      refreshCategoryProducts();
    });

    socket.on('disconnect', () => {
      console.log('[socket] Disconnected from real-time updates');
    });

    // Polling fallback: always poll every 2 seconds to ensure updates are caught quickly
    // This ensures product updates appear even if WebSocket is not working or misses events
    const pollInterval = setInterval(() => {
      console.log('[category] Polling from API to catch any missed updates');
      refreshCategoryProducts();
    }, 2000);

    return () => {
      clearInterval(pollInterval);
      socket.off('connect');
      socket.off('connect_error');
      socket.off('product:created');
      socket.off('product:updated');
      socket.off('product:deleted');
      socket.off('disconnect');
    };
  }, [category, sortItems, refreshCategoryProducts]);

  const totalItems = allItems.length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DieraHeader />
      <main className="flex-1 px-2 sm:px-3 py-3 max-w-[1600px] mx-auto w-full">
        <div className="flex flex-row items-center justify-between gap-2 mb-2">
          <div>
            <h1 className="text-2xl sm:text-2xl capitalize mb-0.5">{cat?.name || category}</h1>
            <p className="text-xs sm:text-xs text-muted-foreground">
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