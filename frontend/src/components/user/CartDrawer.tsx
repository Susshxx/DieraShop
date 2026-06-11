import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Minus, Plus, X } from "lucide-react";
import { useCart, formatNPR } from "@/hooks/useCart";

const CartDrawer = () => {
  const { items, setQty, remove, total, count } = useCart();
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="relative p-2 text-nav-foreground hover:text-nav-hover" aria-label="Cart">
          <ShoppingBag className="w-5 h-5" />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">{count}</span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>Your bag ({count})</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {items.length === 0 && <p className="text-muted-foreground text-sm">Your bag is empty.</p>}
          {items.map((i) => (
            <div key={`${i.productId}-${i.size}-${i.color}`} className="flex gap-3 border-b border-border pb-4">
              <div className="w-20 h-24 bg-muted rounded overflow-hidden flex-shrink-0">
                {i.image && <img src={i.image} alt={i.name} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between gap-2">
                  <p className="text-sm truncate">{i.name}</p>
                  <button onClick={() => remove(i.productId, i.size, i.color)}><X className="w-4 h-4 text-muted-foreground" /></button>
                </div>
                <div className="space-y-0.5">
                  {i.color && <p className="text-xs text-muted-foreground">Color: {i.color}</p>}
                  {i.size && <p className="text-xs text-muted-foreground">Size: {i.size}</p>}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center border border-border rounded">
                    <button onClick={() => setQty(i.productId, i.quantity - 1, i.size, i.color)} className="p-1"><Minus className="w-3 h-3" /></button>
                    <span className="px-2 text-sm">{i.quantity}</span>
                    <button onClick={() => setQty(i.productId, i.quantity + 1, i.size, i.color)} className="p-1"><Plus className="w-3 h-3" /></button>
                  </div>
                  <p className="text-sm">{formatNPR(i.price * i.quantity)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        {items.length > 0 && (
          <div className="border-t border-border pt-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm">Subtotal</span>
              <span className="font-semibold">{formatNPR(total)}</span>
            </div>
            <Button asChild className="w-full"><Link to="/checkout">Checkout</Link></Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
