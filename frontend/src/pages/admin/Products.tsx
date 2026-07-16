import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { formatNPR } from "@/hooks/useCart";
import { toast } from "sonner";

const Products = () => {
  const [items, setItems] = useState<any[]>([]);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  
  const load = async () => {
    const data = await api.get<any[]>("/products?active=false&populate=category");
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

  const getTotalStock = (product: any) => {
    if (product.variantStock && Object.keys(product.variantStock).length > 0) {
      return Object.values(product.variantStock).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0);
    }
    return product.stock || 0;
  };

  const hasVariants = (product: any) => {
    return product.variantStock && Object.keys(product.variantStock).length > 0;
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
            <tr>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Category</th>
              <th className="text-left p-3">Original Price</th>
              <th className="text-left p-3">Price</th>
              <th className="text-left p-3">Stock</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <>
                <tr key={p.id} className="border-t border-border hover:bg-muted/50">
                  <td className="p-3 flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded overflow-hidden">{p.images?.[0] && <img src={p.images[0]} className="w-full h-full object-cover" alt="" />}</div>
                    <div>
                      <p className="font-medium">{p.name}</p>
                      {!p.active && <span className="text-xs text-muted-foreground">(inactive)</span>}
                    </div>
                  </td>
                  <td className="p-3">{p.categoryId?.name || p.categories?.name || p.category?.name || "—"}</td>
                  <td className="p-3">
                    {(p.originalPriceNPR || p.original_price_npr) ? (
                      <div className="flex flex-col">
                        <span className="line-through text-muted-foreground text-xs">
                          {formatNPR(p.originalPriceNPR || p.original_price_npr)}
                        </span>
                        {(p.discountPercent || p.discount_percent) > 0 && (
                          <span className="text-xs text-green-600 font-semibold">
                            {p.discountPercent || p.discount_percent}% OFF
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="p-3 font-semibold">{formatNPR(p.priceNPR || p.price_npr || p.price)}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span>{getTotalStock(p)}</span>
                      {hasVariants(p) && (
                        <button
                          onClick={() => setExpandedProduct(expandedProduct === p.id ? null : p.id)}
                          className="text-primary hover:text-primary/80"
                        >
                          {expandedProduct === p.id ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <Button asChild variant="ghost" size="icon"><Link to={`/admin/products/${p.id}`}><Edit className="w-4 h-4" /></Link></Button>
                    <Button variant="ghost" size="icon" onClick={() => del(p.id)}><Trash2 className="w-4 h-4" /></Button>
                  </td>
                </tr>
                {expandedProduct === p.id && hasVariants(p) && (
                  <tr className="border-t border-border bg-muted/30">
                    <td colSpan={6} className="p-4">
                      <div className="text-xs">
                        <p className="font-semibold mb-2 text-sm">Variant Stock Details:</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {Object.entries(p.variantStock || {}).map(([variant, stock]) => (
                            <div key={variant} className="flex justify-between items-center bg-card p-2 rounded border border-border">
                              <span className="font-medium">{variant}:</span>
                              <span className={`ml-2 ${Number(stock) === 0 ? 'text-destructive' : 'text-foreground'}`}>
                                {String(stock)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {items.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No products yet — create your first one.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Products;
