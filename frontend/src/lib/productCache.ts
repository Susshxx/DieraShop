/**
 * productCache.ts
 * Stale-while-revalidate localStorage cache for product data.
 * - Instantly returns cached data (if any) so the UI renders immediately.
 * - Fetches fresh data in the background and updates the cache.
 * - Cache entries expire after TTL_MS (default 10 minutes).
 */

import { api } from "@/lib/api";

const TTL_MS = 10 * 60 * 1000; // 10 minutes - longer cache for better performance

interface CacheEntry<T> {
  data: T;
  savedAt: number;
}

function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.savedAt > TTL_MS) return null; // expired
    return entry.data;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = { data, savedAt: Date.now() };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // localStorage full or unavailable — fail silently
  }
}

/**
 * Load data with stale-while-revalidate.
 * @param key       localStorage key
 * @param fetcher   async function that returns fresh data
 * @param onData    called immediately with cached data (if any) and again with fresh data
 */
export async function loadWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  onData: (data: T, fromCache: boolean) => void
): Promise<void> {
  // 1. Show cached data immediately (instant render)
  const cached = readCache<T>(key);
  if (cached !== null) {
    onData(cached, true);
  }

  // 2. Fetch fresh data in background and update
  try {
    const fresh = await fetcher();
    writeCache(key, fresh);
    onData(fresh, false);
  } catch (error) {
    // Network error — silently keep whatever we already showed
    console.warn(`Failed to fetch fresh data for ${key}:`, error);
  }
}

// ─── Pre-built cache keys ────────────────────────────────────────────────────

export const CACHE_KEYS = {
  allProducts: "diera-products-all",
  featuredProducts: "diera-featured-products",
  categoryProducts: (slug: string) => `diera-products-cat-${slug}`,
  newIn: "diera-products-new-in",
  categories: "diera-categories-all",
};

// ─── Prefetch helpers (called once on app boot) ──────────────────────────────

/**
 * Prefetch all products and featured products into cache.
 * Call this once at app start so subsequent page visits are instant.
 */
export function prefetchProducts(): void {
  console.log('🚀 Prefetching products for instant page loads...');
  
  // All products (for NewIn / Category pages) - with category data
  loadWithCache(
    CACHE_KEYS.allProducts,
    () => api.get<any[]>("/products?limit=200&populate=category"),
    () => {} // no UI to update — purely warming the cache
  );

  // Featured products (for home page) - with category data
  loadWithCache(
    CACHE_KEYS.featuredProducts,
    () => api.get<any[]>("/products?featured=true&limit=8&populate=category"),
    () => {}
  );

  // Categories (for home page)
  loadWithCache(
    CACHE_KEYS.categories,
    () => api.get<any[]>("/categories"),
    () => {}
  );
  
  console.log('✓ Cache warming initiated');
}

