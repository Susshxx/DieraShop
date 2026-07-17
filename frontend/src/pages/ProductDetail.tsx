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
  const { add, items, openCart } = useCart();
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
        console.log('Product data loaded:', data); // Debug: check category data
        setP(data);
        setMainImg(data?.images?.[0] || "");
        // Only set default size/color if the arrays have valid values
        const validSizes = data?.sizes?.filter((s: string) => s && s.trim()) || [];
        const validColors = data?.colors?.filter((c: string) => c && c.trim()) || [];
        setSize(validSizes[0] || "");
        setSelectedColor(validColors[0] || "");
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

  const handleThumbnailClick = (img: string) => {
    setMainImg(img);
    
    // Also update the selected color if there's a color mapping for this image
    if (p?.colorImageMap && p?.colors) {
      const imageIndex = p.images.indexOf(img);
      // Find which color maps to this image
      for (const [color, idx] of Object.entries(p.colorImageMap)) {
        if (idx === imageIndex) {
          setSelectedColor(color);
          return;
        }
      }
      // Fallback: use image index to match color index
      if (imageIndex !== -1 && p.colors[imageIndex]) {
        setSelectedColor(p.colors[imageIndex]);
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
    
    // Filter out empty/whitespace-only values
    const validSizes = p.sizes?.filter((s: string) => s && s.trim()) || [];
    const validColors = p.colors?.filter((c: string) => c && c.trim()) || [];
    
    if (validSizes.length > 0 && !size) return toast.error("Please select a size");
    if (validColors.length > 0 && !selectedColor) return toast.error("Please select a color");
    
    // Extract product ID safely
    const productId = p._id || p.id;
    if (!productId) {
      console.error("Product data missing ID:", p);
      return toast.error("Product ID not found");
    }
    
    // Check if item already exists in bag
    const existingItem = items.find(
      item => item.productId === String(productId) && 
              item.size === (size || '') && 
              item.color === (selectedColor || '')
    );
    
    if (existingItem) {
      return toast.error("Item already in bag. Update quantity from your bag.");
    }
    
    // Check stock availability
    if (variantStock <= 0) {
      return toast.error("Out of stock");
    }
    
    // Extract price safely
    const price = Number(p.priceNPR || p.price_npr || p.price || 0);
    if (price <= 0) {
      console.error("Product data missing valid price:", p);
      return toast.error("Invalid product price");
    }
    
    // Extract category name safely
    const categoryName = p.categoryId?.name || 
                        p.categories?.name || 
                        p.category?.name || 
                        p.categoryName ||
                        p.category_name ||
                        'Product';
    
    // Use mainImg or fallback to first image
    const productImage = mainImg || p.images?.[0] || p.image || '';
    
    try {
      add({ 
        productId: String(productId), 
        name: p.name || 'Unnamed Product', 
        price, 
        image: productImage,
        category: categoryName,
        size: size || '', 
        color: selectedColor || '',
        quantity: 1 
      });
      toast.success("Added to bag");
    } catch (error) {
      console.error("Error adding to cart:", error, p);
      toast.error("Failed to add item to bag");
    }
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
    
    // Filter out empty/whitespace-only values
    const validSizes = p.sizes?.filter((s: string) => s && s.trim()) || [];
    const validColors = p.colors?.filter((c: string) => c && c.trim()) || [];
    
    if (validSizes.length > 0 && !size) return toast.error("Please select a size");
    if (validColors.length > 0 && !selectedColor) return toast.error("Please select a color");
    
    // Check stock availability
    if (variantStock <= 0) {
      return toast.error("Out of stock");
    }
    
    // Extract product ID safely
    const productId = p._id || p.id;
    if (!productId) {
      console.error("Product data missing ID:", p);
      return toast.error("Product ID not found");
    }
    
    // Check if item already exists in bag
    const existingItem = items.find(
      item => item.productId === String(productId) && 
              item.size === (size || '') && 
              item.color === (selectedColor || '')
    );
    
    // Extract price safely
    const price = Number(p.priceNPR || p.price_npr || p.price || 0);
    if (price <= 0) {
      console.error("Product data missing valid price:", p);
      return toast.error("Invalid product price");
    }
    
    // Extract category name safely
    const categoryName = p.categoryId?.name || 
                        p.categories?.name || 
                        p.category?.name || 
                        p.categoryName ||
                        p.category_name ||
                        'Product';
    
    // Use mainImg or fallback to first image
    const productImage = mainImg || p.images?.[0] || p.image || '';
    
    // Add if not already in bag, then open the bag drawer
    if (!existingItem) {
      try {
        add({ 
          productId: String(productId), 
          name: p.name || 'Unnamed Product', 
          price, 
          image: productImage,
          category: categoryName,
          size: size || '', 
          color: selectedColor || '',
          quantity: 1 
        });
      } catch (error) {
        console.error("Error adding to cart:", error, p);
        toast.error("Failed to add item to bag");
        return;
      }
    }
    
    openCart();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DieraHeader />
      <main className="flex-1 py-6 sm:py-8">
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-4">
          <p className="text-xs text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Home</Link>
            {" / "}
            <Link to="/collections" className="hover:text-foreground">Collections</Link>
            {(() => {
              // Extract category name and slug with multiple fallbacks
              const categoryName = p.categoryId?.name || 
                                  p.categories?.name || 
                                  p.category?.name || 
                                  p.categoryName ||
                                  p.category_name;
              const categorySlug = p.categoryId?.slug || 
                                  p.categories?.slug || 
                                  p.category?.slug || 
                                  p.categorySlug ||
                                  p.category_slug;
              
              if (categoryName) {
                return (
                  <>
                    {" / "}
                    <Link 
                      to={`/category/${categorySlug || ''}`} 
                      className="hover:text-foreground"
                    >
                      {categoryName}
                    </Link>
                  </>
                );
              }
              return null;
            })()}
            {" / "}
            <span className="text-foreground">{p.name}</span>
          </p>
        </div>

        <div className="flex justify-center px-4 sm:px-6">
          <div className="grid lg:grid-cols-[420px_auto] gap-6 sm:gap-8 max-w-5xl">
            {/* Left: Images */}
            <div>
              <div className="aspect-square bg-muted rounded-lg overflow-hidden border border-border max-w-[420px]">
                {mainImg && <img src={mainImg} alt={p.name} className="w-full h-full object-cover" />}
              </div>
              {p.images?.length > 1 && (
                <div className="flex gap-2 mt-2 max-w-[420px]">
                  {p.images.map((img: string, i: number) => (
                    <button 
                      key={i} 
                      onClick={() => handleThumbnailClick(img)} 
                      className={`w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 rounded-md overflow-hidden border-2 transition-all ${
                        mainImg === img ? "border-primary" : "border-border hover:border-gray-400"
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Details */}
            <div className="space-y-3 min-w-[320px]">
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold mb-1">{p.name}</h1>
                <p className="text-sm text-muted-foreground italic">
                  {p.categoryId?.name || p.categories?.name || p.category?.name || p.categoryName || ''}
                </p>
              </div>

              {/* Size Selection */}
              {p.sizes?.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1.5">Size</p>
                  <div className="flex flex-wrap gap-1.5">
                    {p.sizes.map((s: string) => (
                      <button 
                        key={s} 
                        onClick={() => setSize(s)} 
                        className={`min-w-[36px] px-2 py-1 text-xs border rounded transition-all ${
                          size === s 
                            ? "border-primary bg-primary text-primary-foreground" 
                            : "border-border hover:border-primary"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Selection */}
              {p.colors?.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1.5">Color</p>
                  <div className="flex flex-wrap gap-1.5">
                    {p.colors.map((color: string) => (
                      <button 
                        key={color} 
                        onClick={() => handleColorSelect(color)} 
                        className={`min-w-[48px] px-2 py-1 text-xs border rounded transition-all ${
                          selectedColor === color 
                            ? "border-primary bg-primary text-primary-foreground" 
                            : "border-border hover:border-primary"
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

            {/* Stock Details Table - Made more compact */}
            {p.sizes?.length > 0 && p.colors?.length > 0 && p.variantStock && Object.keys(p.variantStock).length > 0 && (
              <div>
                <p className="text-sm font-medium mb-1.5">Stock Details</p>
                <div className="border border-border rounded-md overflow-hidden inline-block">
                  <table className="text-xs">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-2 py-1.5 text-left font-medium">Color</th>
                        {p.sizes.map((s: string) => (
                          <th key={s} className="px-2 py-1.5 text-center font-medium">{s}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {p.colors.map((color: string) => (
                        <tr key={color} className="hover:bg-muted/50">
                          <td className="px-2 py-1.5 font-medium text-xs">{color}</td>
                          {p.sizes.map((s: string) => {
                            const variantKey = `${s}-${color}`;
                            const stock = p.variantStock[variantKey] ?? 0;
                            return (
                              <td key={s} className="px-2 py-1.5 text-center text-xs">
                                <span className={stock > 0 ? "text-foreground" : "text-muted-foreground"}>
                                  {stock}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Description */}
            {p.description && (
              <div>
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                  {p.description}
                </p>
              </div>
            )}

            {/* Price section with discount */}
            {(p.originalPriceNPR || p.original_price_npr) && (p.originalPriceNPR || p.original_price_npr) > (p.priceNPR || p.price_npr || p.price) ? (
              <div className="flex items-center gap-2 py-1">
                {/* Original price strikethrough */}
                <span className="text-base text-muted-foreground line-through">
                  {formatNPR(p.originalPriceNPR || p.original_price_npr)}
                </span>
                {/* Discount badge */}
                {((p.discountPercent || p.discount_percent || 0) > 0) && (
                  <div className="bg-green-500 text-white text-xs font-semibold px-2 py-0.5 rounded-md">
                    {p.discountPercent || p.discount_percent}% OFF
                  </div>
                )}
              </div>
            ) : null}
            
            {/* Current price - always shown */}
            <div className="text-xl sm:text-2xl font-bold">
              {formatNPR(p.priceNPR || p.price_npr || p.price)}
            </div>

            {/* Action Buttons */}
            {role !== "admin" && (
              <div>
                {variantStock <= 0 ? (
                  <Button 
                    variant="destructive"
                    className="w-full h-9 text-sm font-medium"
                    disabled
                  >
                    Out of stock
                  </Button>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      onClick={addToCart} 
                      variant="outline"
                      className="h-9 text-sm font-medium"
                    >
                      Add to bag
                    </Button>
                    <Button 
                      onClick={buyNow} 
                      className="h-9 text-sm font-medium bg-green-600 hover:bg-green-700"
                    >
                      Buy Now
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1.5 text-center">
                  {size && selectedColor ? (
                    <>{variantStock} in stock for {size} - {selectedColor}</>
                  ) : (
                    <>Select size and color to see availability</>
                  )}
                </p>
              </div>
            )}
            
            {role === "admin" && (
              <p className="text-sm text-muted-foreground italic text-center">
                Admins cannot purchase items
              </p>
            )}
          </div>
        </div>
        </div>

        {/* Questions & Reviews Section */}
        <div className="flex justify-center px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-6 mt-8 max-w-5xl w-full">
            <ProductQA productId={p.id} />
            <ProductReviews productId={p.id} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;
