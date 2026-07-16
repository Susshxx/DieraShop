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
    <div className="rounded-xl overflow-hidden group-hover:ring-2 group-hover:ring-primary/50 transition-all duration-300">
      <div 
        ref={imageRef}
        className="aspect-[2/3] bg-muted overflow-hidden relative cursor-pointer select-none"
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
        
        {currentImage && p.images?.[currentImage.index] && (
          <img 
            src={p.images[currentImage.index]} 
            alt={p.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            draggable={false}
          />
        )}

        {/* Color dots - show on hover if multiple images/colors available */}
        {availableImages.length > 1 && isHovered && (
          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1.5 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-full shadow-lg">
            {availableImages.map((img, idx) => (
              <button
                key={idx}
                onClick={(e) => handleColorDotClick(e, idx)}
                className={`w-3 h-3 rounded-full border-2 transition-all ${
                  currentImageIndex === idx
                    ? 'border-primary scale-110'
                    : 'border-gray-300 hover:border-gray-500'
                }`}
                style={{
                  backgroundColor: img.color || '#6b7280',
                }}
                title={img.color || `Variant ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
      
      <div className="bg-muted/30 px-3 py-2.5 space-y-1.5">
        {/* Color dots — clickable, switch product image */}
        <div className="flex gap-1.5 items-center">
          {p.colors && p.colors.slice(0, 4).map((color: string, idx: number) => {
            // Find the availableImages index for this color
            const imgIdx = availableImages.findIndex(img => img.color === color);
            const targetIdx = imgIdx !== -1 ? imgIdx : 0;
            const isActive = currentImageIndex === targetIdx && imgIdx !== -1;
            return (
              <button
                key={idx}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (imgIdx !== -1) setCurrentImageIndex(imgIdx);
                }}
                title={color}
                className={`w-4 h-4 rounded-full transition-all duration-200 flex-shrink-0 ${
                  isActive
                    ? 'ring-2 ring-offset-1 ring-primary scale-110'
                    : 'hover:ring-2 hover:ring-offset-1 hover:ring-primary/60 hover:scale-105'
                }`}
                style={{
                  backgroundColor: color,
                  border: '1.5px solid rgba(0,0,0,0.18)',
                  cursor: imgIdx !== -1 ? 'pointer' : 'default',
                }}
              />
            );
          })}
          {p.colors && p.colors.length > 4 && (
            <span className="text-xs text-muted-foreground">+{p.colors.length - 4}</span>
          )}
        </div>

        {/* Product name */}
        <p className="text-base font-semibold line-clamp-1 leading-tight">{p.name}</p>
        
        {/* Collection name - multiple fallback options */}
        <p className="text-sm text-muted-foreground line-clamp-1">
          {p.categoryId?.name || p.categories?.name || p.category?.name || 'Collection'}
        </p>
        
        {/* Price section */}
        <div className="flex items-center justify-between pt-1">
          {/* Left side - discount badge */}
          <div>
            {(p.discountPercent || p.discount_percent) > 0 && (
              <div className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-md inline-flex items-center gap-0.5">
                {p.discountPercent || p.discount_percent}% ↓
              </div>
            )}
          </div>
          
          {/* Right side - prices */}
          <div className="flex flex-col items-end">
            {/* Show original price if there's a discount */}
            {(p.originalPriceNPR || p.original_price_npr) && (p.originalPriceNPR || p.original_price_npr) > (p.priceNPR || p.price_npr || p.price) && (
              <span className="text-xs text-muted-foreground line-through">
                {formatNPR(p.originalPriceNPR || p.original_price_npr)}
              </span>
            )}
            {/* Current price */}
            <span className="text-lg font-bold text-foreground">
              {formatNPR(p.priceNPR || p.price_npr || p.price)}
            </span>
          </div>
        </div>
      </div>
    </div>
    </Link>
  );
};

export default ProductCard;
