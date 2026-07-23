import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import DieraHeader from "@/components/header/DieraHeader";
import Footer from "@/components/footer/Footer";
import { api } from "@/lib/api";
import { formatNPR } from "@/hooks/useCart";

// Simple search cache with 2 minute TTL
const searchCache = new Map<string, { data: any; timestamp: number }>();
const SEARCH_CACHE_TTL = 2 * 60 * 1000; // 2 minutes

const SearchResults = () => {
  const [params] = useSearchParams();
  const q = params.get("q") || "";
  const [results, setResults] = useState<any[]>([]);

  // Set page title
  useEffect(() => {
    if (q) {
      document.title = `Search: ${q} - Diera Shop | Women's Fashion`;
    } else {
      document.title = "Search - Diera Shop | Find Your Style";
    }
  }, [q]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q) {
      setResults([]);
      return;
    }
    
    // Check cache first
    const cached = searchCache.get(q);
    if (cached && Date.now() - cached.timestamp < SEARCH_CACHE_TTL) {
      setResults(cached.data.products || []);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    api.get<{ products: any[] }>(`/search?q=${encodeURIComponent(q)}`)
      .then((data) => {
        setResults(data.products || []);
        // Cache the results
        searchCache.set(q, { data, timestamp: Date.now() });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [q]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DieraHeader />
      <main className="flex-1 px-4 sm:px-6 py-8 max-w-6xl mx-auto w-full">
        <h1 className="text-2xl mb-2">Search</h1>
        <p className="text-muted-foreground mb-6">{loading ? "Searching…" : `${results.length} result(s) for "${q}"`}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {results.map((p) => (
            <Link key={p.id} to={`/product/${p.slug}`} className="group">
              <div className="aspect-[3/4] bg-muted rounded overflow-hidden mb-2">
                {p.images?.[0] && <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />}
              </div>
              <p className="text-sm">{p.name}</p>
              <p className="text-sm text-muted-foreground">{formatNPR(p.price_npr ?? p.price)}</p>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SearchResults;
