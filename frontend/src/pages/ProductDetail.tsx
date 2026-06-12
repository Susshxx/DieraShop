import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import DieraHeader from "@/components/header/DieraHeader";
import Footer from "@/components/footer/Footer";
import { api } from "@/lib/api";
import { useCart, formatNPR } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ProductQA from "@/components/user/ProductQA";
import ProductReviews from "@/components/user/ProductReviews";

const ProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { add, items } = useCart();
  const { role, user } = useAuth();
  const [p, setP] = useState<any>(null);
  const [mainImg, setMainImg] = useState<string>("");
  const [size, setSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");

  // Get variant-specific stock
  const getVariantStock = () => {
    if (!p || !size || !selectedColor) return p?.stock || 0;
    
    // Check if product has variantStock data
    if (p.variantStock && Object.keys(p.variantStock).length > 0) {
      const variantKey = `${size}-${selectedColor}`;
      return p.variantStock[variantKey] ?? 0;
    }
    
    // Fallback to general stock
    return p.stock || 0;
  };

  const variantStock = getVariantStock();

  useEffect(() => {
    if (!productId) return;
    api.get<any>(`/products/slug/${productId}`)
      .then((data) => {
        setP(data);
        setMainImg(data?.images?.[0] || "");
        setSize(data?.sizes?.[0] || "");
        setSelectedColor(data?.colors?.[0] || "");
      })
      .catch(() => setP(null));
  }, [productId]);

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    // Check if there's a mapped image for this color
    if (p?.colorImageMap && p.colorImageMap[color] !== undefined) {
      const imageIndex = p.colorImageMap[color];
      if (p.images && p.images[imageIndex]) {
        setMainImg(p.images[imageIndex]);
      }
    } else {
      // Fallback: use color index to match image index
      const colorIndex = p?.colors?.indexOf(color);
      if (colorIndex !== -1 && p?.images?.[colorIndex]) {
        setMainImg(p.images[colorIndex]);
      }
    }
  };

  if (!p) return (
    <div className="min-h-screen bg-background flex flex-col">
      <DieraHeader />
      <main className="flex-1 px-6 py-20 text-center text-muted-foreground">Loading…</main>
      <Footer />
    </div>
  );

  const addToCart = () => {
    if (!user) {
      toast.error("Please sign in to add items to your bag");
      navigate("/auth/login");
      return;
    }
    if (role === "admin") {
      return toast.error("Admins cannot add items to cart");
    }
    if (p.sizes?.length && !size) return toast.error("Please select a size");
    if (p.colors?.length && !selectedColor) return toast.error("Please select a color");
    
    // Check current cart quantity for this product variant
    const existingItem = items.find(
      item => item.productId === p.id && 
              item.size === size && 
              item.color === selectedColor
    );
    const currentQty = existingItem ? existingItem.quantity : 0;
    
    if (currentQty + 1 > variantStock) {
      return toast.error(`Only ${variantStock} items available in stock`);
    }
    
    add({ 
      productId: p.id, 
      name: p.name, 
      price: Number(p.price_npr ?? p.price), 
      image: mainImg,
      category: p.category_name || p.categoryName,
      size, 
      color: selectedColor,
      quantity: 1 
    });
    toast.success("Added to bag");
  };

  const buyNow = () => {
    if (!user) {
      toast.error("Please sign in to purchase");
      navigate("/auth/login");
      return;
    }
    if (role === "admin") {
      return toast.error("Admins cannot purchase items");
    }
    if (p.sizes?.length && !size) return toast.error("Please select a size");
    if (p.colors?.length && !selectedColor) return toast.error("Please select a color");
    
    // Check current cart quantity for this product variant
    const existingItem = items.find(
      item => item.productId === p.id && 
              item.size === size && 
              item.color === selectedColor
    );
    const currentQty = existingItem ? existingItem.quantity : 0;
    
    if (currentQty + 1 > variantStock) {
      return toast.error(`Only ${variantStock} items available in stock`);
    }
    
    add({ 
      productId: p.id, 
      name: p.name, 
      price: Number(p.price_npr ?? p.price), 
      image: mainImg,
      category: p.category_name || p.categoryName,
      size, 
      color: selectedColor,
      quantity: 1 
    });
    navigate("/checkout");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DieraHeader />
      <main className="flex-1">
        <div className="grid lg:grid-cols-2 gap-3 sm:gap-4 px-3 sm:px-4 py-3 sm:py-4 max-w-5xl mx-auto">
          <div>
            <div className="aspect-square bg-muted rounded overflow-hidden">
              {mainImg && <img src={mainImg} alt={p.name} className="w-full h-full object-cover" />}
            </div>
            {p.images?.length > 1 && (
              <div className="flex gap-1.5 mt-1.5 overflow-x-auto">
                {p.images.map((img: string, i: number) => (
                  <button key={i} onClick={() => setMainImg(img)} className={`w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 rounded overflow-hidden border-2 ${mainImg === img ? "border-primary" : "border-transparent"}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Link to={`/category/all`} className="text-xs text-muted-foreground uppercase tracking-wide">Diera Shop</Link>
            <h1 className="text-xl sm:text-2xl font-normal italic">{p.name}</h1>
            <p className="text-lg sm:text-xl">{formatNPR(p.price_npr ?? p.price)}</p>
            <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">{p.description}</p>

            {p.sizes?.length > 0 && (
              <div className="pt-1">
                <p className="text-xs mb-1.5 italic">Size</p>
                <div className="flex flex-wrap gap-1.5">
                  {p.sizes.map((s: string) => (
                    <button key={s} onClick={() => setSize(s)} className={`px-3 py-1.5 text-xs border rounded ${size === s ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{s}</button>
                  ))}
                </div>
              </div>
            )}
            {p.colors?.length > 0 && (
              <div className="pt-1">
                <p className="text-xs mb-1.5 italic">Color</p>
                <div className="flex flex-wrap gap-1.5">
                  {p.colors.map((color: string) => (
                    <button 
                      key={color} 
                      onClick={() => handleColorSelect(color)} 
                      className={`px-3 py-1.5 text-xs border rounded transition-all ${selectedColor === color ? "border-primary bg-primary text-primary-foreground shadow-md" : "border-border hover:border-primary/50"}`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {role !== "admin" && (
              <div className="pt-2">
                {variantStock <= 0 ? (
                  <Button 
                    variant="destructive"
                    className="w-full h-9 text-xs"
                    disabled
                  >
                    Out of stock
                  </Button>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-1.5">
                    <Button 
                      onClick={addToCart} 
                      variant="outline"
                      className="flex-1 h-9 text-xs"
                    >
                      Add to bag
                    </Button>
                    <Button 
                      onClick={buyNow} 
                      className="flex-1 h-9 text-xs"
                    >
                      Buy now
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            {role === "admin" && (
              <p className="text-xs text-muted-foreground italic pt-2">
                Admins cannot purchase items
              </p>
            )}

            <p className="text-xs text-muted-foreground italic pt-1">
              {size && selectedColor ? (
                <>{variantStock} in stock for {size} - {selectedColor}</>
              ) : (
                <>Select size and color to see availability</>
              )}
            </p>
          </div>
        </div>
        <div className="grid lg:grid-cols-2 gap-4 px-3 sm:px-4 pb-4 max-w-5xl mx-auto">
          <ProductQA productId={p.id} />
          <ProductReviews productId={p.id} />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;
