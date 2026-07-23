import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import DieraHeader from "@/components/header/DieraHeader";
import Footer from "@/components/footer/Footer";
import { api, wsUrl, getToken } from "@/lib/api";
import { connectSocket } from "@/lib/socket";
import EditableImage from "@/components/admin/EditableImage";
import ProductCard from "@/components/product/ProductCard";
import heroDefault from "@/assets/hero-image.png";
import ProfileCompleteDialog from "@/components/user/ProfileCompleteDialog";
import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

// No default category images - all loaded from database
const categoryImages: Record<string, string> = {};

const getProductPrice = (product: any): number => {
  const raw = product?.priceNPR ?? product?.price_npr ?? product?.price ?? 0;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : 0;
  const cleaned = String(raw).replace(/[^0-9.-]/g, "");
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

const Index = () => {
  const [featured, setFeatured] = useState<any[]>([]); // Raw unsorted data from API
  const [sortedFeatured, setSortedFeatured] = useState<any[]>([]); // Sorted version
  const [displayedFeatured, setDisplayedFeatured] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [catsLoading, setCatsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [sortBy, setSortBy] = useState<string>("default");
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  const ITEMS_PER_BATCH = 12; // Load 12 items at a time

  // Set page title
  useEffect(() => {
    document.title = "Diera Shop - Premium Women's Fashion & Clothing Store in Nepal | Home";
  }, []);

  // Keep a ref in sync with sortBy so the data-fetching effect (which only
  // runs once, on mount) can always sort with the CURRENT sort option
  // instead of the value it closed over at mount time.
  const sortByRef = useRef(sortBy);
  useEffect(() => {
    sortByRef.current = sortBy;
  }, [sortBy]);

  // Guards the data-fetching effect below against React StrictMode's
  // intentional double-invocation in development.
  const hasLoadedDataRef = useRef(false);

  const bannerMessages = [
    { text: "Welcome to Diera Shop ❤️", link: null },
    { text: "Shop our Latest Collection 🛍️", link: "/category/new-in" }
  ];

  // Sort products based on selected option
  const sortProducts = useCallback((products: any[], sortOption: string) => {
    if (!products || products.length === 0) return [];

    console.log('[sort] Sorting', products.length, 'products with option:', sortOption);
    const sorted = [...products];

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

          const stockA = getStockLevel(a);
          const stockB = getStockLevel(b);
          return stockA - stockB;
        });

      default:
        console.log('[sort] Using default order (no sorting)');
        return sorted;
    }
  }, []);

  // Apply sorting when sortBy or featured changes
  useEffect(() => {
    console.log('[effect] Sort effect triggered - sortBy:', sortBy, 'featured count:', featured.length);
    if (featured.length > 0) {
      const sorted = sortProducts(featured, sortBy);
      console.log('[effect] Sorted result sample (first 3):', sorted.slice(0, 3).map(p => ({
        name: p.name,
        price: getProductPrice(p)
      })));
      setSortedFeatured(sorted);
      // Reset displayed products to show first batch of sorted results
      setDisplayedFeatured(sorted.slice(0, ITEMS_PER_BATCH));
      console.log('[effect] Updated sortedFeatured and displayedFeatured');
    } else {
      setSortedFeatured([]);
      setDisplayedFeatured([]);
    }
  }, [sortBy, featured, sortProducts]);

  // Auto-rotate banner every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % bannerMessages.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const nextBanner = () => {
    setCurrentBannerIndex((prev) => (prev + 1) % bannerMessages.length);
  };

  const prevBanner = () => {
    setCurrentBannerIndex((prev) => (prev - 1 + bannerMessages.length) % bannerMessages.length);
  };

  // Load more featured products when scrolling
  const loadMoreFeatured = useCallback(() => {
    if (loadingMore || displayedFeatured.length >= sortedFeatured.length) return;

    setLoadingMore(true);
    const nextBatch = sortedFeatured.slice(displayedFeatured.length, displayedFeatured.length + ITEMS_PER_BATCH);

    // Simulate slight delay for smooth loading
    setTimeout(() => {
      setDisplayedFeatured(prev => [...prev, ...nextBatch]);
      setLoadingMore(false);
    }, 100);
  }, [sortedFeatured, displayedFeatured, loadingMore]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && sortedFeatured.length > 0) {
          loadMoreFeatured();
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
  }, [loadMoreFeatured, sortedFeatured]);

  const refreshFeaturedProducts = useCallback(() => {
    console.log('[featured] Refreshing featured products...');
    api.get<any[]>("/products?featured=true").then((data) => {
      console.log(`[featured] Refreshed ${data.length} products from API`);
      console.log('[featured] Product IDs:', data.map(p => ({ id: p.id, name: p.name, hasImages: p.images?.length > 0, imageCount: p.images?.length || 0 })));
      
      // Don't filter by images - show all featured products even if they don't have images yet
      setFeatured(data);
      const sorted = sortProducts(data, sortByRef.current);
      setSortedFeatured(sorted);
      setDisplayedFeatured(sorted.slice(0, ITEMS_PER_BATCH));
    }).catch((err) => {
      console.error('Failed to refresh featured products:', err);
    });
  }, [sortProducts]);

  const refreshCategories = useCallback(() => {
    api.get<any[]>("/categories").then((data) => {
      console.log(`[categories] Refreshed ${data.length} categories from API`);
      setCats(data);
    }).catch((err) => {
      console.error('Failed to refresh categories:', err);
    });
  }, []);

  useEffect(() => {
    if (hasLoadedDataRef.current) return;
    hasLoadedDataRef.current = true;

    // Load featured products and categories in parallel for faster rendering
    Promise.all([
      api.get<any[]>("/products?featured=true"),
      api.get<any[]>("/categories")
    ]).then(([featuredData, categoriesData]) => {
      console.log(`[featured] Loaded ${featuredData.length} products from API`);
      console.log(`[categories] Loaded ${categoriesData.length} categories from API`);
      
      // Don't filter by images - show all featured products even if they don't have images yet
      setFeatured(featuredData);
      const sorted = sortProducts(featuredData, sortByRef.current);
      setSortedFeatured(sorted);
      setDisplayedFeatured(sorted.slice(0, ITEMS_PER_BATCH));
      
      setCats(categoriesData);
      setInitialLoading(false);
      setCatsLoading(false);
    }).catch((err) => {
      console.error('Failed to load initial data:', err);
      setInitialLoading(false);
      setCatsLoading(false);
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
      // Optimistically add new product to state for instant feedback
      if (data && data.id) {
        setFeatured(prev => [...prev, data]);
        const sorted = sortProducts([...featured, data], sortByRef.current);
        setSortedFeatured(sorted);
        setDisplayedFeatured(sorted.slice(0, ITEMS_PER_BATCH));
      }
      // Also refresh from API to ensure consistency
      refreshFeaturedProducts();
    });

    socket.on('product:updated', (data) => {
      console.log('[socket] Product updated event received:', data);
      lastSocketMessage = Date.now();
      refreshFeaturedProducts();
    });

    socket.on('product:deleted', (data) => {
      console.log('[socket] Product deleted event received:', data);
      lastSocketMessage = Date.now();
      // Immediately remove from state for instant feedback
      if (data && data.id) {
        setFeatured(prev => prev.filter(p => p.id !== data.id));
        setSortedFeatured(prev => prev.filter(p => p.id !== data.id));
        setDisplayedFeatured(prev => prev.filter(p => p.id !== data.id));
      }
      // Also refresh from API to ensure consistency
      refreshFeaturedProducts();
    });

    socket.on('category:created', () => {
      console.log('[socket] Category created - refreshing categories');
      refreshCategories();
    });

    socket.on('category:updated', () => {
      console.log('[socket] Category updated - refreshing categories');
      refreshCategories();
    });

    socket.on('category:deleted', () => {
      console.log('[socket] Category deleted - refreshing categories');
      refreshCategories();
    });

    socket.on('disconnect', () => {
      console.log('[socket] Disconnected from real-time updates');
    });

    // Polling fallback: always poll every 2 seconds to ensure updates are caught quickly
    // This ensures product updates appear even if WebSocket is not working or misses events
    const pollInterval = setInterval(() => {
      console.log('[featured] Polling from API to catch any missed updates');
      refreshFeaturedProducts();
    }, 2000);

    return () => {
      clearInterval(pollInterval);
      socket.off('connect');
      socket.off('connect_error');
      socket.off('product:created');
      socket.off('product:updated');
      socket.off('product:deleted');
      socket.off('category:created');
      socket.off('category:updated');
      socket.off('category:deleted');
      socket.off('disconnect');
    };
  }, [refreshFeaturedProducts, refreshCategories]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ProfileCompleteDialog />
      <DieraHeader />
      <main className="flex-1">
        {/* Hero - Desktop only shows image, Mobile shows welcome banner carousel */}
        <section className="relative">
          {/* Desktop Hero Image */}
          <div className="hidden sm:block">
            <EditableImage
              slotKey="home_hero"
              defaultSrc={heroDefault}
              alt="Diera Shop hero"
              className="block"
              imgClassName="w-full h-[60vh] object-cover"
            />
          </div>

          {/* Mobile Welcome Banner Carousel */}
          <div className="sm:hidden bg-white border-b border-gray-200">
            <div className="relative py-2 px-4">
              <div className="flex items-center justify-between">
                {/* Left Arrow */}
                <button
                  onClick={prevBanner}
                  className="text-gray-600 hover:text-gray-900 transition-colors p-1"
                  aria-label="Previous message"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Banner Message */}
                <div className="flex-1 text-center overflow-hidden">
                  <div className="transition-all duration-500 ease-in-out">
                    {bannerMessages[currentBannerIndex].link ? (
                      <Link
                        to={bannerMessages[currentBannerIndex].link}
                        className="text-s text-gray-700 inline-block hover:text-gray-900 transition-colors cursor-pointer underline underline-offset-4 decoration-1"
                      >
                        {bannerMessages[currentBannerIndex].text}
                      </Link>
                    ) : (
                      <span className="text-s text-gray-700 inline-block">
                        {bannerMessages[currentBannerIndex].text}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Arrow */}
                <button
                  onClick={nextBanner}
                  className="text-gray-600 hover:text-gray-900 transition-colors p-1"
                  aria-label="Next message"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Categories - Horizontal scrollable circular layout */}
        <section className="pt-4 pb-4 sm:pt-10 sm:pb-4 bg-background">
          <h2 className="text-2xl sm:text-2xl mb-4 text-center px-4 sm:px-6 text-primary">Shop by Collection</h2>

          {catsLoading ? (
            // Skeleton outline while categories are loading - avoids
            // flashing "Couldn't find Categories" before the fetch resolves.
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-4 sm:gap-6 pb-2 pt-2 px-4 sm:px-6 justify-start sm:justify-center min-w-min">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex-shrink-0 animate-pulse">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-muted mb-2 ring-2 ring-border" />
                    <div className="h-3 bg-muted rounded w-16 sm:w-20 mx-auto" />
                  </div>
                ))}
              </div>
            </div>
          ) : cats.length > 0 ? (
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-4 sm:gap-6 pb-2 pt-2 px-4 sm:px-6 justify-start sm:justify-center min-w-min">
                {cats.map((c) => (
                  <Link key={c.slug} to={`/category/${c.slug}`} className="group block flex-shrink-0">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 overflow-hidden rounded-full bg-muted mb-2 ring-2 ring-border group-hover:ring-primary transition-all shadow-md flex items-center justify-center cursor-pointer">
                      <EditableImage
                        slotKey={`home_collection_${c.slug}`}
                        defaultSrc={c.image_url || categoryImages[c.slug] || heroDefault}
                        alt={c.name}
                        className="block w-full h-full"
                        imgClassName="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <p className="text-center text-m sm:text-base font-medium line-clamp-2 leading-tight w-20 sm:w-24">{c.name}</p>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground text-sm px-4">Couldn't find Categories.</p>
          )}
        </section>

        {/* Featured */}
        {initialLoading ? (
          <section className="pt-4 sm:pt-6 pb-8 sm:pb-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <h2 className="text-xl sm:text-2xl mb-3 sm:mb-4 text-center text-primary">Featured Products</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-[2/3] bg-muted rounded-xl mb-2"></div>
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : displayedFeatured.length > 0 ? (
          <section className="pt-4 sm:pt-6 pb-8 sm:pb-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-2xl sm:text-2xl text-center text-primary flex-1">
                  Featured Products
                </h2>

                {/* Filter Icon Button */}
                <button
                  onClick={() => setFilterDialogOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-border hover:bg-accent transition-colors"
                  aria-label="Filter products"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-5">
                {displayedFeatured.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              {/* Loading indicator and observer target */}
              {displayedFeatured.length < sortedFeatured.length && (
                <div ref={observerTarget} className="flex justify-center mt-6">
                  <div className="animate-pulse text-muted-foreground text-sm">
                    Loading more products...
                  </div>
                </div>
              )}
            </div>
          </section>
        ) : null}
      </main>
      <Footer />

      {/* Filter Dialog */}
      <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Products Filter</DialogTitle>
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

export default Index;