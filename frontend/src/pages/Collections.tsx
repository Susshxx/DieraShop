import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import DieraHeader from "@/components/header/DieraHeader";
import Footer from "@/components/footer/Footer";
import { api } from "@/lib/api";
import { connectSocket } from "@/lib/socket";
import EditableImage from "@/components/admin/EditableImage";
import heroDefault from "@/assets/hero-image.png";

const Collections = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Set page title
  useEffect(() => {
    document.title = "Collections - Diera Shop | Women's Fashion Categories";
  }, []);

  const refreshCollections = useCallback(async () => {
    try {
      console.log('[collections] Refreshing collections...');
      const cats = await api.get<any[]>("/categories");
      console.log('[collections] Loaded', cats.length, 'categories');
      
      // Load images for categories
      const catsWithImages = await Promise.all(
        cats.map(async (cat) => {
          try {
            const imgData = await api.get<any>(`/site-images/home_collection_${cat.slug}`);
            return { ...cat, image_url: imgData.imageData || imgData.image_data || cat.image_url };
          } catch {
            return cat;
          }
        })
      );
      console.log('[collections] Setting categories state with', catsWithImages.length, 'categories');
      setCategories(catsWithImages);
      setLoading(false); // Show categories immediately, counts load in background
      
      // Load product counts for each category in background
      const counts: Record<string, number> = {};
      await Promise.all(
        catsWithImages.map(async (cat) => {
          try {
            const products = await api.get<any[]>(`/products?categoryId=${cat.id}`);
            console.log(`[collections] Category ${cat.name} has ${products.length} products`);
            counts[cat.id] = products.length;
          } catch {
            counts[cat.id] = 0;
          }
        })
      );
      console.log('[collections] Product counts:', counts);
      setProductCounts(counts);
    } catch (err) {
      console.error('Failed to refresh collections:', err);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCollections();

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

    socket.on('category:created', (data) => {
      console.log('[socket] Category created event received:', data);
      lastSocketMessage = Date.now();
      refreshCollections();
    });

    socket.on('category:updated', (data) => {
      console.log('[socket] Category updated event received:', data);
      lastSocketMessage = Date.now();
      refreshCollections();
    });

    socket.on('category:modified', (data) => {
      console.log('[socket] Category modified event received:', data);
      lastSocketMessage = Date.now();
      refreshCollections();
    });

    socket.on('category:deleted', (data) => {
      console.log('[socket] Category deleted event received:', data);
      lastSocketMessage = Date.now();
      refreshCollections();
    });

    socket.on('product:created', (data) => {
      console.log('[socket] Product created event received:', data);
      lastSocketMessage = Date.now();
      // Optimistically refresh to catch new products
      refreshCollections();
    });

    socket.on('product:updated', (data) => {
      console.log('[socket] Product updated event received:', data);
      lastSocketMessage = Date.now();
      refreshCollections();
    });

    socket.on('product:deleted', (data) => {
      console.log('[socket] Product deleted event received:', data);
      lastSocketMessage = Date.now();
      // Immediately update product counts by refreshing
      refreshCollections();
    });

    socket.on('disconnect', () => {
      console.log('[socket] Disconnected from real-time updates');
    });

    // Polling fallback: always poll every 2 seconds to ensure updates are caught quickly
    // This ensures product counts update even if WebSocket is not working or misses events
    const pollInterval = setInterval(() => {
      console.log('[collections] Polling from API to catch any missed updates');
      refreshCollections();
    }, 2000);

    return () => {
      clearInterval(pollInterval);
      socket.off('connect');
      socket.off('connect_error');
      socket.off('category:created');
      socket.off('category:updated');
      socket.off('category:modified');
      socket.off('category:deleted');
      socket.off('product:created');
      socket.off('product:updated');
      socket.off('product:deleted');
      socket.off('disconnect');
    };
  }, [refreshCollections]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DieraHeader />
      <main className="flex-1 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl font-semibold mb-3">Our Collections</h1>
            <p className="text-muted-foreground">
              Explore our curated collections of premium products
            </p>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">Loading collections...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">No collections available yet.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {categories.map((category, index) => {
                  console.log(`[collections] Rendering category ${index + 1}/${categories.length}:`, category.name);
                  return (
                    <Link
                      key={category.id}
                      to={`/category/${category.slug}`}
                      className="group block"
                    >
                      <div className="relative overflow-hidden rounded-xl bg-muted shadow hover:shadow-md transition-all duration-300">
                        {/* Image */}
                        <div className="aspect-square overflow-hidden">
                          <EditableImage
                            slotKey={`home_collection_${category.slug}`}
                            defaultSrc={category.image_url || heroDefault}
                            alt={category.name}
                            className="block w-full h-full"
                            imgClassName="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>

                        {/* Info overlay at bottom */}
                        <div className="absolute bottom-0 left-0 right-0 bg-muted/90 backdrop-blur-sm px-3 py-2.5 text-center">
                          <h2 className="text-sm font-semibold leading-tight truncate">
                            {category.name}
                          </h2>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {productCounts[category.id] || 0}{" "}
                            {productCounts[category.id] === 1 ? "Item" : "Items"}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground text-center mt-4">
                Showing {categories.length} collections
              </p>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Collections;
