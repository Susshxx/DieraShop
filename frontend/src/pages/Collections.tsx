import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DieraHeader from "@/components/header/DieraHeader";
import Footer from "@/components/footer/Footer";
import { api } from "@/lib/api";
import { loadWithCache, CACHE_KEYS } from "@/lib/productCache";
import EditableImage from "@/components/admin/EditableImage";
import heroDefault from "@/assets/hero-image.png";

const Collections = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load categories
    loadWithCache<any[]>(
      CACHE_KEYS.categories,
      () => api.get<any[]>("/categories"),
      async (cats) => {
        // Show all categories in collections page (no filtering)
        
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
        setCategories(catsWithImages);
        
        // Load product counts for each category
        const counts: Record<string, number> = {};
        await Promise.all(
          catsWithImages.map(async (cat) => {
            try {
              const products = await api.get<any[]>(`/products?categoryId=${cat.id}`);
              counts[cat.id] = products.length;
            } catch {
              counts[cat.id] = 0;
            }
          })
        );
        setProductCounts(counts);
        setLoading(false);
      }
    );
  }, []);

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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {categories.map((category) => (
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
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Collections;
