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
  const { add } = useCart();
  const { role, user } = useAuth();
  const [p, setP] = useState<any>(null);
  const [mainImg, setMainImg] = useState<string>("");
  const [size, setSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");

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
        <div className="grid lg:grid-cols-2 gap-6 px-4 sm:px-6 py-8 max-w-6xl mx-auto">
          <div>
            <div className="aspect-[3/4] bg-muted rounded overflow-hidden">
              {mainImg && <img src={mainImg} alt={p.name} className="w-full h-full object-cover" />}
            </div>
            {p.images?.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto">
                {p.images.map((img: string, i: number) => (
                  <button key={i} onClick={() => setMainImg(img)} className={`w-20 h-20 rounded overflow-hidden border-2 ${mainImg === img ? "border-primary" : "border-transparent"}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <Link to={`/category/all`} className="text-xs text-muted-foreground uppercase">Diera Shop</Link>
            <h1 className="text-3xl mt-1 mb-2">{p.name}</h1>
            <p className="text-xl mb-4">{formatNPR(p.price_npr ?? p.price)}</p>
            <p className="text-sm text-muted-foreground mb-6 whitespace-pre-line">{p.description}</p>

            {p.sizes?.length > 0 && (
              <div className="mb-4">
                <p className="text-sm mb-2">Size</p>
                <div className="flex flex-wrap gap-2">
                  {p.sizes.map((s: string) => (
                    <button key={s} onClick={() => setSize(s)} className={`px-4 py-2 text-sm border rounded ${size === s ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{s}</button>
                  ))}
                </div>
              </div>
            )}
            {p.colors?.length > 0 && (
              <div className="mb-4">
                <p className="text-sm mb-2">Color</p>
                <div className="flex flex-wrap gap-2">
                  {p.colors.map((color: string) => (
                    <button 
                      key={color} 
                      onClick={() => handleColorSelect(color)} 
                      className={`px-4 py-2 text-sm border rounded transition-all ${selectedColor === color ? "border-primary bg-primary text-primary-foreground shadow-md" : "border-border hover:border-primary/50"}`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {role !== "admin" && (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={addToCart} 
                  variant="outline"
                  className="flex-1 sm:flex-none"
                  disabled={p.stock <= 0}
                >
                  {p.stock > 0 ? "Add to bag" : "Out of stock"}
                </Button>
                <Button 
                  onClick={buyNow} 
                  className="flex-1 sm:flex-none"
                  disabled={p.stock <= 0}
                >
                  {p.stock > 0 ? "Buy now" : "Out of stock"}
                </Button>
              </div>
            )}
            
            {role === "admin" && (
              <p className="text-sm text-muted-foreground italic">
                Admins cannot purchase items
              </p>
            )}

            <p className="text-xs text-muted-foreground mt-4">{p.stock} in stock</p>
          </div>
        </div>
        <div className="grid lg:grid-cols-2 gap-8">
          <ProductQA productId={p.id} />
          <ProductReviews productId={p.id} />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;
