import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DieraHeader from "@/components/header/DieraHeader";
import Footer from "@/components/footer/Footer";
import { api } from "@/lib/api";
import { formatNPR } from "@/hooks/useCart";
import { isNewProduct } from "@/lib/productUtils";
import NewBadge from "@/components/product/NewBadge";

const NewIn = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Fetch all products and sort by creation date (newest first)
    api.get<any[]>("/products?limit=50")
      .then((products) => {
        // Sort by createdAt date in descending order (newest first)
        const sortedProducts = products.sort((a, b) => {
          const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
          const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
          return dateB - dateA;
        });
        setItems(sortedProducts);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DieraHeader />
      <main className="flex-1 px-4 sm:px-6 py-8 max-w-6xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-light mb-2">New In</h1>
          <p className="text-muted-foreground">
            Discover our latest jewelry pieces, freshly added to the collection
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-muted-foreground">Loading latest products...</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-6">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {items.map((p) => (
                <Link key={p.id} to={`/product/${p.slug}`} className="group">
                  <div className="aspect-[3/4] bg-muted rounded-lg overflow-hidden mb-3 relative">
                    {isNewProduct(p.created_at || p.createdAt) && <NewBadge />}
                    {p.images?.[0] && (
                      <img 
                        src={p.images[0]} 
                        alt={p.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                    )}
                  </div>
                  <p className="text-sm font-light mb-1">{p.name}</p>
                  <p className="text-sm text-muted-foreground">{formatNPR(p.price_npr ?? p.price)}</p>
                  {p.colors?.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {p.colors.length} {p.colors.length === 1 ? 'color' : 'colors'}
                    </p>
                  )}
                </Link>
              ))}
              {items.length === 0 && (
                <div className="col-span-full text-center py-20">
                  <p className="text-muted-foreground">No products available yet.</p>
                  <Link to="/" className="text-primary hover:underline text-sm mt-2 inline-block">
                    Return to home
                  </Link>
                </div>
              )}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default NewIn;
