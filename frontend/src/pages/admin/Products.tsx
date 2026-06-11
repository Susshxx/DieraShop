import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { formatNPR } from "@/hooks/useCart";
import { toast } from "sonner";

const Products = () => {
  const [items, setItems] = useState<any[]>([]);
  const load = async () => {
    const data = await api.get<any[]>("/products?active=false");
    setItems(data || []);
  };
  useEffect(() => { load(); }, []);

  const del = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success("Deleted");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl">Products</h1>
        <Button asChild><Link to="/admin/products/new"><Plus className="w-4 h-4 mr-2" />New product</Link></Button>
      </div>
      <div className="border border-border rounded-lg bg-card overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-muted text-xs uppercase">
            <tr><th className="text-left p-3">Name</th><th className="text-left p-3">Category</th><th className="text-left p-3">Price</th><th className="text-left p-3">Stock</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="p-3 flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded overflow-hidden">{p.images?.[0] && <img src={p.images[0]} className="w-full h-full object-cover" alt="" />}</div>
                  <div>
                    <p className="font-medium">{p.name}</p>
                    {!p.active && <span className="text-xs text-muted-foreground">(inactive)</span>}
                  </div>
                </td>
                <td className="p-3">{p.categories?.name || "—"}</td>
                <td className="p-3">{formatNPR(p.price_npr ?? p.price)}</td>
                <td className="p-3">{p.stock}</td>
                <td className="p-3 text-right">
                  <Button asChild variant="ghost" size="icon"><Link to={`/admin/products/${p.id}`}><Edit className="w-4 h-4" /></Link></Button>
                  <Button variant="ghost" size="icon" onClick={() => del(p.id)}><Trash2 className="w-4 h-4" /></Button>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No products yet — create your first one.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Products;
