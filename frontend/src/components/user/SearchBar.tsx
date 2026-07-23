import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { api } from "@/lib/api";
import { formatNPR } from "@/hooks/useCart";

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  price: number;
  price_npr?: number;
  images: string[] | null;
}

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
}

interface SearchResponse {
  products: ProductRow[];
  categories: CategoryRow[];
  pages: { name: string; path: string }[];
}

const SearchBar = () => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    if (!q.trim()) { 
      setResults([]);
      setCategories([]);
      return;
    }
    // Only search after 3 characters are entered
    if (q.trim().length < 3) {
      console.log('[search] Query too short:', q.length, 'chars');
      setResults([]);
      setCategories([]);
      return;
    }
    console.log('[search] Triggering search for:', q);
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.get<SearchResponse>(`/search?q=${encodeURIComponent(q)}`);
        console.log('[search] Results received:', data.products?.length, 'products');
        setResults(data.products || []);
        setCategories(data.categories || []);
      } catch (err) {
        console.error('[search] Error:', err);
        setResults([]);
        setCategories([]);
      }
      setLoading(false);
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    setOpen(false);
    nav(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="p-2 text-nav-foreground hover:text-nav-hover" aria-label="Search">
        <Search className="w-5 h-5" />
      </button>

      {open && (
        <>
          {/* Blur backdrop - positioned below header (z-30) */}
          <div
            className="fixed inset-0 z-30"
            style={{ 
              backdropFilter: 'blur(12px)', 
              WebkitBackdropFilter: 'blur(12px)', 
              backgroundColor: 'rgba(0,0,0,0.4)',
              top: '64px' // Start below the header (header height is 4rem = 64px)
            }}
            onClick={() => setOpen(false)}
          />

          {/* Search panel - positioned below header but above backdrop */}
          <div className="fixed inset-x-0 z-50 pointer-events-none" style={{ top: '64px' }}>
            <div className="max-w-2xl mx-auto mt-4 px-4 pointer-events-auto">
              <form onSubmit={submit} className="flex items-center gap-2 bg-background border-b-2 border-primary pb-2 px-2 rounded-t-lg shadow-2xl">
                <Search className="w-5 h-5 text-muted-foreground" />
                <input
                  ref={inputRef}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search clothes, categories…"
                  className="flex-1 bg-transparent outline-none text-lg"
                />
                <button type="button" onClick={() => setOpen(false)} className="p-1"><X className="w-5 h-5" /></button>
              </form>

              <div className="mt-0 bg-background rounded-b-lg border border-border max-h-[60vh] overflow-y-auto shadow-2xl">
              {loading && <div className="p-6 text-sm text-muted-foreground">Searching…</div>}
              {!loading && q && results.length === 0 && categories.length === 0 && (
                <div className="p-6 text-sm text-muted-foreground">No products or categories found for "{q}"</div>
              )}
              {!loading && !q && (
                <div className="p-6">
                  <p className="text-xs uppercase text-muted-foreground mb-3">Popular</p>
                  <div className="flex flex-wrap gap-2">
                    {["Boots", "Hoodie", "Shoes", "Trousers", "Tshirts"].map((p) => (
                      <button key={p} onClick={() => setQ(p)} className="px-3 py-1 text-sm border border-border rounded-full hover:bg-accent">{p}</button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Categories Section */}
              {categories.length > 0 && (
                <div className="border-b border-border">
                  <div className="px-4 py-2 bg-muted/50">
                    <p className="text-xs uppercase text-muted-foreground font-semibold">Categories</p>
                  </div>
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/category/${cat.slug}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-accent border-b border-border last:border-b-0"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium">{cat.name.charAt(0)}</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{cat.name}</div>
                        <div className="text-xs text-muted-foreground">View all {cat.name}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              
              {/* Products Section */}
              {results.length > 0 && (
                <div>
                  {categories.length > 0 && (
                    <div className="px-4 py-2 bg-muted/50">
                      <p className="text-xs uppercase text-muted-foreground font-semibold">Products</p>
                    </div>
                  )}
                  {results.map((p) => (
                    <Link
                      key={p.id}
                      to={`/product/${p.slug}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 p-3 hover:bg-accent border-b border-border last:border-b-0"
                    >
                      <div className="w-12 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                        {p.images?.[0] && <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{formatNPR(p.price_npr ?? p.price)}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default SearchBar;
