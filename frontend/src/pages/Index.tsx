import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import DieraHeader from "@/components/header/DieraHeader";
import Footer from "@/components/footer/Footer";
import { api } from "@/lib/api";
import EditableImage from "@/components/admin/EditableImage";
import ProductCard from "@/components/product/ProductCard";
import heroDefault from "@/assets/hero-image.png";
import { loadWithCache, CACHE_KEYS } from "@/lib/productCache";
import ProfileCompleteDialog from "@/components/user/ProfileCompleteDialog";

// No default category images - all loaded from database
const categoryImages: Record<string, string> = {};

const Index = () => {
  const [featured, setFeatured] = useState<any[]>([]);
  const [displayedFeatured, setDisplayedFeatured] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const observerTarget = useRef<HTMLDivElement>(null);
  const ITEMS_PER_BATCH = 12; // Load 12 items at a time

  // Load more featured products when scrolling
  const loadMoreFeatured = useCallback(() => {
    if (loadingMore || displayedFeatured.length >= featured.length) return;
    
    setLoadingMore(true);
    const nextBatch = featured.slice(displayedFeatured.length, displayedFeatured.length + ITEMS_PER_BATCH);
    
    // Simulate slight delay for smooth loading
    setTimeout(() => {
      setDisplayedFeatured(prev => [...prev, ...nextBatch]);
      setLoadingMore(false);
    }, 100);
  }, [featured, displayedFeatured, loadingMore]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && featured.length > 0) {
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
  }, [loadMoreFeatured, featured]);

  useEffect(() => {
    // Featured products — load directly without cache for faster first load
    api.get<any[]>("/products?featured=true&limit=12")
      .then((data) => {
        setFeatured(data);
        setDisplayedFeatured(data.slice(0, 12));
        setInitialLoading(false);
      })
      .catch(() => {
        setFeatured([]);
        setInitialLoading(false);
      });

    // Categories — load directly without images
    api.get<any[]>("/categories")
      .then((data) => {
        setCats(data);
      })
      .catch(() => setCats([]));
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ProfileCompleteDialog />
      <DieraHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative">
          <EditableImage
            slotKey="home_hero"
            defaultSrc={heroDefault}
            alt="Diera Shop hero"
            className="block"
            imgClassName="w-full h-[50vh] sm:h-[60vh] object-cover"
          />
        </section>

        {/* Categories - Horizontal scrollable circular layout */}
        <section className="pt-6 pb-4 sm:pt-10 sm:pb-6 bg-background">
          <h2 className="text-xl sm:text-2xl mb-4 text-center px-4 sm:px-6 text-primary">Shop by collection</h2>
          
          {/* Horizontal scrollable circular icons for all screen sizes */}
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
                  <p className="text-center text-sm sm:text-base font-medium line-clamp-2 leading-tight w-20 sm:w-24">{c.name}</p>
                </Link>
              ))}
            </div>
          </div>
          
          {cats.length === 0 && <p className="text-center text-muted-foreground text-sm px-4">Add categories in the admin to get started.</p>}
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
              <h2 className="text-xl sm:text-2xl mb-3 sm:mb-4 text-center text-primary">Featured Products</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
                {displayedFeatured.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              
              {/* Loading indicator and observer target */}
              {displayedFeatured.length < featured.length && (
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
    </div>
  );
};

export default Index;
