import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { useAuth } from "./useAuth";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  category?: string;
  size?: string;
  color?: string;
  quantity: number;
}

interface CartCtx {
  items: CartItem[];
  add: (i: CartItem) => void;
  remove: (productId: string, size?: string, color?: string) => void;
  setQty: (productId: string, qty: number, size?: string, color?: string) => void;
  clear: () => void;
  total: number;
  count: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const Ctx = createContext<CartCtx | undefined>(undefined);

// Returns a storage key scoped to the user so carts don't bleed between accounts
const cartKey = (userId?: string) => `diera-cart${userId ? `-${userId}` : ""}`;

// Other re-fetchable caches (see Index.tsx) that are safe to evict to free
// up localStorage space if the cart write runs out of quota. These just
// get re-downloaded from the API on next load — no data loss.
const EVICTABLE_CACHE_KEYS = [
  "diera-featured-products",
  "diera-featured-timestamp",
  "diera-categories",
  "diera-categories-timestamp",
];

const isQuotaExceededError = (err: unknown): boolean =>
  err instanceof DOMException &&
  (err.name === "QuotaExceededError" ||
    // Older/Firefox naming
    err.name === "NS_ERROR_DOM_QUOTA_REACHED");

// Persists the cart to localStorage without ever throwing. Cart items can
// carry a full base64 product image, which is large enough to blow past
// localStorage's ~5-10MB quota once a few items are added — and an
// uncaught QuotaExceededError here previously crashed the whole app,
// since CartProvider wraps the entire component tree.
const safeSetCart = (key: string, items: CartItem[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(items));
    return;
  } catch (err) {
    if (!isQuotaExceededError(err)) {
      console.warn("[cart] Failed to persist cart:", err);
      return;
    }
  }

  // Quota exceeded — first try freeing space by evicting other
  // re-fetchable caches before giving up on anything cart-related.
  console.warn("[cart] Storage quota exceeded, evicting other caches and retrying");
  for (const k of EVICTABLE_CACHE_KEYS) {
    try {
      localStorage.removeItem(k);
    } catch {
      // ignore - localStorage may be unavailable entirely
    }
  }

  try {
    localStorage.setItem(key, JSON.stringify(items));
    return;
  } catch (err) {
    if (!isQuotaExceededError(err)) {
      console.warn("[cart] Failed to persist cart after evicting caches:", err);
      return;
    }
  }

  // Still over quota — the cart's own data (its base64 product images) is
  // too large by itself. Fall back to persisting a lightweight version
  // without images so the cart survives a refresh; thumbnails will just
  // reload blank until the product data is fetched again.
  console.warn("[cart] Still over quota after evicting caches, persisting cart without images");
  try {
    const lightweight = items.map((i) => ({ ...i, image: "" }));
    localStorage.setItem(key, JSON.stringify(lightweight));
  } catch (err) {
    // Give up on persistence entirely. The cart keeps working fine in
    // memory for this session - it just won't survive a full page reload.
    console.warn("[cart] Unable to persist cart at all, continuing in-memory only:", err);
  }
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { role, user, loading: authLoading } = useAuth();

  // Track the previous userId so we can detect a real logout (not just a cold load)
  const prevUserIdRef = useRef<string | undefined>(undefined);

  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  // When auth resolves, load the correct cart from localStorage
  useEffect(() => {
    if (authLoading) return; // wait until auth is settled

    if (user && role !== "admin") {
      // User logged in — load their personal cart
      const key = cartKey(user.id);
      try {
        const saved = JSON.parse(localStorage.getItem(key) || "[]");
        setItems(Array.isArray(saved) ? saved : []);
      } catch {
        setItems([]);
      }
      prevUserIdRef.current = user.id;
    } else if (!user) {
      // No user — only clear if a user was previously logged in (real logout),
      // not on the initial undefined → undefined cold load
      if (prevUserIdRef.current !== undefined) {
        // Genuine logout: clear state (but keep localStorage so re-login restores it)
        setItems([]);
      }
      prevUserIdRef.current = undefined;
    }
    // admin: cart stays empty, no localStorage interaction needed
  }, [user, role, authLoading]);

  // Persist items to the user-scoped key whenever items change
  useEffect(() => {
    if (authLoading || !user || role === "admin") return;
    safeSetCart(cartKey(user.id), items);
  }, [items, user, role, authLoading]);

  const keyOf = (id: string, size?: string, color?: string) =>
    `${id}::${size ?? ""}::${color ?? ""}`;

  const add = (i: CartItem) => {
    if (!user || role === "admin") return;
    setItems((cur) => {
      const ix = cur.findIndex(
        (c) => keyOf(c.productId, c.size, c.color) === keyOf(i.productId, i.size, i.color)
      );
      if (ix >= 0) {
        const next = [...cur];
        next[ix] = { ...next[ix], quantity: next[ix].quantity + i.quantity };
        return next;
      }
      return [...cur, i];
    });
  };

  const remove = (id: string, size?: string, color?: string) =>
    setItems((cur) =>
      cur.filter((c) => keyOf(c.productId, c.size, c.color) !== keyOf(id, size, color))
    );

  const setQty = (id: string, qty: number, size?: string, color?: string) =>
    setItems((cur) =>
      cur
        .map((c) =>
          keyOf(c.productId, c.size, c.color) === keyOf(id, size, color)
            ? { ...c, quantity: qty }
            : c
        )
        .filter((c) => c.quantity > 0)
    );

  const clear = () => {
    setItems([]);
    if (user) {
      try {
        localStorage.removeItem(cartKey(user.id));
      } catch {
        // ignore - non-critical
      }
    }
  };

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <Ctx.Provider value={{ items, add, remove, setQty, clear, total, count, isCartOpen, openCart, closeCart }}>
      {children}
    </Ctx.Provider>
  );
};

export const useCart = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCart must be inside CartProvider");
  return v;
};

export const formatNPR = (n: number) =>
  `रू ${new Intl.NumberFormat("en-IN").format(Math.round(n))}`;