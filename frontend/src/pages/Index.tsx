import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DieraHeader from "@/components/header/DieraHeader";
import Footer from "@/components/footer/Footer";
import { api } from "@/lib/api";
import { formatNPR } from "@/hooks/useCart";
import { isNewProduct } from "@/lib/productUtils";
import NewBadge from "@/components/product/NewBadge";
import EditableImage from "@/components/admin/EditableImage";
import heroDefault from "@/assets/hero-image.png";

// No default category images - all loaded from database
const categoryImages: Record<string, string> = {};

const Index = () => {
  const [featured, setFeatured] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);

  useEffect(() => {
    api.get<any[]>("/products?featured=true&limit=8").then(setFeatured).catch(() => {});
    api.get<any[]>("/categories").then((data) => {
      // Fetch category images for ALL categories (no limit)
      const catsWithImages = data.map(async (cat) => {
        try {
          const imgData = await api.get<any>(`/site-images/home_collection_${cat.slug}`);
          return {
            ...cat,
            image_url: imgData.imageData || imgData.image_data || cat.image_url
          };
        } catch {
          return cat;
        }
      });
      Promise.all(catsWithImages).then(setCats);
    }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent flex items-end">
            <div className="px-6 sm:px-12 pb-8 sm:pb-12 max-w-2xl">
              <h1 className="text-3xl sm:text-5xl text-foreground mb-3">Diera Shop</h1>
              <p className="text-sm sm:text-base text-foreground/80 mb-4">Handpicked clothes from Nepal — soft, modern, made for everyday grace.</p>
              <Link to="/category/new-in" className="inline-block bg-primary text-primary-foreground px-5 py-2.5 rounded hover:opacity-90 transition text-sm sm:text-base">Shop new arrivals</Link>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="px-4 sm:px-6 pt-6 pb-4 sm:pt-10 sm:pb-6 max-w-7xl mx-auto">
          <h2 className="text-xl sm:text-2xl mb-4 text-center">Shop by collection</h2>
          
          {/* Mobile: Horizontal scrollable round small icons (5 visible at a time) */}
          <div className="md:hidden overflow-x-auto scrollbar-hide">
            <div className="flex gap-2.5 pb-2">
              {cats.map((c) => (
                <Link key={c.id} to={`/category/${c.slug}`} className="group block flex-shrink-0 w-16">
                  <div className="w-16 h-16 overflow-hidden rounded-full bg-muted mb-1.5 ring-2 ring-border group-hover:ring-primary transition-all shadow-sm">
                    <EditableImage
                      slotKey={`home_collection_${c.slug}`}
                      defaultSrc={c.image_url || categoryImages[c.slug] || heroDefault}
                      alt={c.name}
                      className="block w-full h-full"
                      imgClassName="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <p className="text-center text-[9px] font-medium line-clamp-2 leading-tight">{c.name}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Desktop: Grid layout */}
          <div className="hidden md:grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 sm:gap-6">
            {cats.map((c) => (
              <Link key={c.id} to={`/category/${c.slug}`} className="group block">
                <div className="aspect-[3/4] overflow-hidden rounded-lg bg-muted mb-3">
                  <EditableImage
                    slotKey={`home_collection_${c.slug}`}
                    defaultSrc={c.image_url || categoryImages[c.slug] || heroDefault}
                    alt={c.name}
                    className="block w-full h-full"
                    imgClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <p className="text-center text-sm font-medium">{c.name}</p>
              </Link>
            ))}
          </div>
          
          {cats.length === 0 && <p className="text-center text-muted-foreground text-sm">Add categories in the admin to get started.</p>}
        </section>

        {/* Mid-Page Banner */}
        <section className="relative w-full px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            {/* Mobile: Single image */}
            <div className="relative overflow-hidden group md:hidden">
              <EditableImage
                slotKey="home_mid_banner_right"
                defaultSrc={heroDefault}
                alt="Featured collection"
                className="block"
                imgClassName="w-full h-[25vh] object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </div>
            
            {/* Desktop: Two images */}
            <div className="hidden md:grid grid-cols-3 gap-4 sm:gap-6">
              {/* Left Image - 1/3 width */}
              <div className="relative overflow-hidden group">
                <EditableImage
                  slotKey="home_mid_banner_left"
                  defaultSrc={heroDefault}
                  alt="Collection highlight"
                  className="block"
                  imgClassName="w-full h-[45vh] lg:h-[55vh] object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              
              {/* Right Image - 2/3 width */}
              <div className="relative col-span-2 overflow-hidden group">
                <EditableImage
                  slotKey="home_mid_banner_right"
                  defaultSrc={heroDefault}
                  alt="Featured collection"
                  className="block"
                  imgClassName="w-full h-[45vh] lg:h-[55vh] object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Featured */}
        {featured.length > 0 && (
          <section className="pt-4 sm:pt-6 pb-8 sm:pb-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <h2 className="text-xl sm:text-2xl mb-3 sm:mb-4 text-center">Featured Products</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-1.5 sm:gap-3">
                {featured.map((p) => (
                  <Link key={p.id} to={`/product/${p.slug}`} className="group">
                    <div className="aspect-[3/4] bg-muted rounded overflow-hidden mb-1 sm:mb-1.5 relative">
                      {isNewProduct(p.created_at || p.createdAt) && <NewBadge />}
                      {p.images?.[0] && (
                        <img 
                          src={p.images[0]} 
                          alt={p.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                      )}
                    </div>
                    <div className="space-y-0">
                      <p className="text-[10px] sm:text-xs text-center line-clamp-1 leading-tight">{p.name}</p>
                      <p className="text-[10px] sm:text-xs text-center text-muted-foreground">{formatNPR(p.price_npr ?? p.price)}</p>
                    </div>
                  </Link>
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
