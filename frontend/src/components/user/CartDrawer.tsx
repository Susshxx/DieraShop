import { Link, useNavigate } from "react-router-dom";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ShoppingBag, X, Minus, Plus } from "lucide-react";
import { useCart, formatNPR } from "@/hooks/useCart";

/* Sad empty bag SVG matching the mockup */
const EmptyBagIllustration = () => (
  <svg width="100" height="110" viewBox="0 0 100 110" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Bag body */}
    <rect x="15" y="35" width="65" height="55" rx="8" stroke="currentColor" strokeWidth="2.5" fill="none" />
    {/* Handle */}
    <path d="M35 35 Q35 18 50 18 Q65 18 65 35" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    {/* Sad face */}
    <circle cx="38" cy="58" r="3" fill="currentColor" />
    <circle cx="62" cy="58" r="3" fill="currentColor" />
    <path d="M38 72 Q50 64 62 72" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* Little bug/mouse at bottom left */}
    <circle cx="22" cy="98" r="5" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <line x1="26" y1="95" x2="34" y2="88" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const CartDrawer = () => {
  const { items, setQty, remove, total, count, isCartOpen, openCart, closeCart } = useCart();
  const navigate = useNavigate();

  return (
    <>
      {/* Trigger button in header */}
      <button
        className="relative p-2 text-nav-foreground hover:text-nav-hover"
        aria-label="Cart"
        onClick={openCart}
      >
        <ShoppingBag className="w-5 h-5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {count}
          </span>
        )}
      </button>

      <Sheet open={isCartOpen} onOpenChange={(o) => (o ? openCart() : closeCart())}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-sm flex flex-col p-0 gap-0"
          style={{ background: "hsl(var(--background))" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-foreground" />
              <span className="text-xl font-semibold tracking-tight">Your Bag</span>
            </div>
            <button
              onClick={closeCart}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close"
            >
            </button>
          </div>

          {/* Body */}
          {items.length === 0 ? (
            /* ── Empty state ── */
            <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
              <div className="text-muted-foreground">
                <EmptyBagIllustration />
              </div>
              <p className="text-xl font-semibold mt-2">Your bag seems empty!</p>
              <button
                onClick={() => { closeCart(); navigate("/collections"); }}
                className="mt-1 px-8 py-2.5 rounded-full bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <>
              {/* ── Items ── */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {items.map((i) => (
                  <div
                    key={`${i.productId}-${i.size}-${i.color}`}
                    className="relative flex gap-3 border border-border rounded-xl p-3"
                  >
                    {/* Remove */}
                    <button
                      onClick={() => remove(i.productId, i.size, i.color)}
                      className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    {/* Image */}
                    <div className="w-20 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                      {i.image && (
                        <img src={i.image} alt={i.name} className="w-full h-full object-cover" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 pr-5">
                      <p className="font-semibold text-base leading-tight truncate">{i.name}</p>
                      {i.color && (
                        <p className="text-sm text-muted-foreground mt-0.5">Color:{i.color}</p>
                      )}
                      {i.size && (
                        <p className="text-sm text-muted-foreground">Size: {i.size}</p>
                      )}

                      <div className="flex items-center justify-between mt-2">
                        {/* Qty controls */}
                        <div className="flex items-center border border-border rounded-lg overflow-hidden">
                          <button
                            onClick={() => setQty(i.productId, i.quantity - 1, i.size, i.color)}
                            className="px-2 py-1 text-lg leading-none hover:bg-muted transition-colors"
                          >
                            -
                          </button>
                          <span className="px-3 text-sm font-medium">{i.quantity}</span>
                          <button
                            onClick={() => setQty(i.productId, i.quantity + 1, i.size, i.color)}
                            className="px-2 py-1 text-lg leading-none hover:bg-muted transition-colors"
                          >
                            +
                          </button>
                        </div>

                        {/* Price */}
                        <p className="text-lg font-bold">
                          Rs {new Intl.NumberFormat("en-IN").format(Math.round(i.price * i.quantity))}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Footer ── */}
              <div className="px-4 pb-6 pt-3 border-t border-border space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-base text-muted-foreground">Subtotal</span>
                  <span className="text-2xl font-semibold">
                    Rs. {new Intl.NumberFormat("en-IN").format(Math.round(total))}
                  </span>
                </div>
                <Link
                  to="/checkout"
                  onClick={closeCart}
                  className="block w-full text-center py-3 rounded-xl border border-foreground text-foreground text-base font-medium hover:bg-foreground hover:text-background transition-colors"
                >
                  Checkout
                </Link>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};

export default CartDrawer;
