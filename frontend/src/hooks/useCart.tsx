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
    localStorage.setItem(cartKey(user.id), JSON.stringify(items));
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
    if (user) localStorage.removeItem(cartKey(user.id));
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
