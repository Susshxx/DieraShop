import { useEffect, useState } from "react";
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
  const [cats, setCats] = useState<any[]>([]);

  useEffect(() => {
    // Featured products — instant from cache, refreshed in background
    loadWithCache<any[]>(
      CACHE_KEYS.featuredProducts,
      () => api.get<any[]>("/products?featured=true&limit=8&populate=category"),
      (data) => setFeatured(data)
    );

    // Categories — instant from cache, refreshed in background
    loadWithCache<any[]>(
      CACHE_KEYS.categories,
      () => api.get<any[]>("/categories"),
      async (data) => {
        // Load category images in parallel
        const catsWithImages = await Promise.all(
          data.map(async (cat) => {
            try {
              const imgData = await api.get<any>(`/site-images/home_collection_${cat.slug}`);
              return { ...cat, image_url: imgData.imageData || imgData.image_data || cat.image_url };
            } catch {
              return cat;
            }
          })
        );
        setCats(catsWithImages);
      }
    );
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
          <div className="overflow-x-auto scrollbar-hide px-4 sm:px-6">
            <div className="flex gap-4 sm:gap-6 pb-2 pt-2 justify-start sm:justify-center" style={{ paddingRight: '1rem' }}>
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
              {/* Trailing spacer so last item has breathing room after scroll */}
              <div className="flex-shrink-0 w-4 sm:w-6" aria-hidden="true" />
            </div>
          </div>
          
          {cats.length === 0 && <p className="text-center text-muted-foreground text-sm px-4">Add categories in the admin to get started.</p>}
        </section>

        {/* Featured */}
        {featured.length > 0 && (
          <section className="pt-4 sm:pt-6 pb-8 sm:pb-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <h2 className="text-xl sm:text-2xl mb-3 sm:mb-4 text-center text-primary">Featured Products</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
                {featured.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Index;
