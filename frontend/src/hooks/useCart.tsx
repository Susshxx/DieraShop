import { createContext, useContext, useEffect, useState, ReactNode } from "react";
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
}

const Ctx = createContext<CartCtx | undefined>(undefined);
const KEY = "diera-cart";

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { role, user } = useAuth();
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem(KEY) || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  // Clear cart when user is not logged in or is an admin
  useEffect(() => {
    if (!user || role === "admin") {
      setItems([]);
      localStorage.removeItem(KEY);
    }
  }, [user, role]);

  const keyOf = (id: string, size?: string, color?: string) => `${id}::${size ?? ""}::${color ?? ""}`;

  const add = (i: CartItem) => {
    // Don't allow adding to cart if admin or not logged in
    if (!user || role === "admin") {
      return;
    }
    
    setItems((cur) => {
      const ix = cur.findIndex((c) => keyOf(c.productId, c.size, c.color) === keyOf(i.productId, i.size, i.color));
      if (ix >= 0) {
        const next = [...cur];
        next[ix] = { ...next[ix], quantity: next[ix].quantity + i.quantity };
        return next;
      }
      return [...cur, i];
    });
  };
  const remove = (id: string, size?: string, color?: string) =>
    setItems((cur) => cur.filter((c) => keyOf(c.productId, c.size, c.color) !== keyOf(id, size, color)));
  const setQty = (id: string, qty: number, size?: string, color?: string) =>
    setItems((cur) =>
      cur
        .map((c) =>
          keyOf(c.productId, c.size, c.color) === keyOf(id, size, color) ? { ...c, quantity: qty } : c
        )
        .filter((c) => c.quantity > 0)
    );
  const clear = () => {
    setItems([]);
    localStorage.removeItem(KEY);
  };
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <Ctx.Provider value={{ items, add, remove, setQty, clear, total, count }}>
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
