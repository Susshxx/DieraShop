import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { formatNPR } from "@/hooks/useCart";
import { isNewProduct } from "@/lib/productUtils";
import NewBadge from "@/components/product/NewBadge";

interface ProductCardProps {
  product: any;
}

const ProductCard = ({ product: p }: ProductCardProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const imageRef = useRef<HTMLDivElement>(null);

  // Get available images based on color variants
  const getAvailableImages = () => {
    const images: { index: number; color?: string }[] = [];
    
    // Add main image
    if (p.images && p.images.length > 0) {
      images.push({ index: 0 });
    }

    // Add color-specific images
    if (p.colors && p.colorImageMap) {
      p.colors.forEach((color: string) => {
        const colorImageIndex = p.colorImageMap[color];
        if (colorImageIndex !== undefined && p.images[colorImageIndex]) {
          images.push({ index: colorImageIndex, color });
        }
      });
    }

    // Remove duplicates based on image index
    const uniqueImages = images.filter(
      (img, idx, arr) => arr.findIndex((i) => i.index === img.index) === idx
    );

    return uniqueImages;
  };

  const availableImages = getAvailableImages();

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(false);
    dragStartX.current = e.clientX;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (Math.abs(e.clientX - dragStartX.current) > 5) {
      setIsDragging(true);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStartX.current;
    
    if (Math.abs(deltaX) > 50) {
      if (deltaX > 0 && currentImageIndex > 0) {
        setCurrentImageIndex(currentImageIndex - 1);
      } else if (deltaX < 0 && currentImageIndex < availableImages.length - 1) {
        setCurrentImageIndex(currentImageIndex + 1);
      }
    }
    
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(false);
    dragStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (Math.abs(e.touches[0].clientX - dragStartX.current) > 5) {
      setIsDragging(true);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging) return;

    const deltaX = e.changedTouches[0].clientX - dragStartX.current;
    
    if (Math.abs(deltaX) > 50) {
      if (deltaX > 0 && currentImageIndex > 0) {
        setCurrentImageIndex(currentImageIndex - 1);
      } else if (deltaX < 0 && currentImageIndex < availableImages.length - 1) {
        setCurrentImageIndex(currentImageIndex + 1);
      }
    }
    
    setIsDragging(false);
  };

  const handleColorDotClick = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex(index);
  };

  const currentImage = availableImages[currentImageIndex];

  return (
    <Link 
      to={`/product/${p.slug}`} 
      className="group block"
      onClick={(e) => {
        if (isDragging) {
          e.preventDefault();
        }
      }}
    >
    <div className="rounded-lg overflow-hidden group-hover:ring-2 group-hover:ring-primary/50 transition-all duration-300">
      <div 
        ref={imageRef}
        className="aspect-[3/4] bg-muted overflow-hidden relative cursor-pointer select-none"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {isNewProduct(p.created_at || p.createdAt) && <NewBadge />}
        
        {/* Discount Badge - light green background with black text */}
        {(p.discountPercent || p.discount_percent) > 0 && (
          <div className="absolute top-2 right-2 bg-green-200 text-black text-xs font-bold px-2 py-1 rounded-md z-10 shadow-md" style={{ fontFamily: "'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', sans-serif", fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>
            {p.discountPercent || p.discount_percent}% OFF
          </div>
        )}
        
        {currentImage && p.images?.[currentImage.index] && (
          <img 
            src={p.images[currentImage.index]} 
            alt={p.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            draggable={false}
          />
        )}
      </div>
      
      <div className="bg-muted/30 px-2 py-2 space-y-1">
        {/* Product name - Clean readable font */}
        <p className="text-l sm:text-base font-medium line-clamp-1 leading-tight">
          {p.name}
        </p>
        
        {/* Price section - Tabular numbers for better readability */}
        <div className="flex flex-col gap-0">
          {/* Show original price if there's a discount */}
          {(p.originalPriceNPR || p.original_price_npr) && (p.originalPriceNPR || p.original_price_npr) > (p.priceNPR || p.price_npr || p.price) && (
            <span className="text-xs text-muted-foreground line-through tabular-nums" style={{ fontFamily: "'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', sans-serif", fontVariantNumeric: 'tabular-nums' }}>
              {formatNPR(p.originalPriceNPR || p.original_price_npr)}
            </span>
          )}
          {/* Current price - Bold and clear */}
          <span className="text-base sm:text-lg font-semibold text-foreground tabular-nums" style={{ fontFamily: "'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', sans-serif", fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>
            {formatNPR(p.priceNPR || p.price_npr || p.price)}
          </span>
        </div>
      </div>
    </div>
    </Link>
  );
};

export default ProductCard;
