import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DieraHeader from "@/components/header/DieraHeader";
import Footer from "@/components/footer/Footer";
import { api } from "@/lib/api";
import { formatNPR } from "@/hooks/useCart";
import { isNewProduct } from "@/lib/productUtils";
import NewBadge from "@/components/product/NewBadge";

const Category = () => {
  const { category } = useParams();
  const [cat, setCat] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (!category) return;
    api.get<any>(`/categories/slug/${category}`)
      .then((data) => {
        setCat(data);
        return api.get<any[]>(`/products?categoryId=${data.id}`);
      })
      .then((ps) => setItems(ps || []))
      .catch(() => {
        api.get<any[]>("/products").then(setItems).catch(() => {});
      });
  }, [category]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DieraHeader />
      <main className="flex-1 px-4 sm:px-6 py-8 max-w-6xl mx-auto w-full">
        <h1 className="text-3xl mb-2 capitalize">{cat?.name || category}</h1>
        <p className="text-muted-foreground mb-8">{items.length} item(s)</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((p) => (
            <Link key={p.id} to={`/product/${p.slug}`} className="group">
              <div className="aspect-[3/4] bg-muted rounded overflow-hidden mb-2 relative">
                {isNewProduct(p.created_at || p.createdAt) && <NewBadge />}
                {p.images?.[0] && <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />}
              </div>
              <p className="text-sm">{p.name}</p>
              <p className="text-sm text-muted-foreground">{formatNPR(p.price_npr ?? p.price)}</p>
            </Link>
          ))}
          {items.length === 0 && <p className="col-span-full text-muted-foreground">No products yet.</p>}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Category;
