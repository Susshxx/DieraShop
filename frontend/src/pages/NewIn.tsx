import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DieraHeader from "@/components/header/DieraHeader";
import Footer from "@/components/footer/Footer";
import { api } from "@/lib/api";
import { formatNPR } from "@/hooks/useCart";
import { isNewProduct } from "@/lib/productUtils";
import NewBadge from "@/components/product/NewBadge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const NewIn = () => {
  const [allItems, setAllItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    // Fetch all products and sort by creation date (newest first)
    api.get<any[]>("/products?limit=50")
      .then((products) => {
        // Sort by createdAt date in descending order (newest first)
        const sortedProducts = products.sort((a, b) => {
          const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
          const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
          return dateB - dateA;
        });
        setAllItems(sortedProducts);
        setCurrentPage(1);
      })
      .catch(() => setAllItems([]))
      .finally(() => setLoading(false));
  }, []);

  // Calculate pagination
  const totalItems = allItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = allItems.slice(startIndex, endIndex);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    
    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('...');
      }
      
      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      
      // Always show last page
      pages.push(totalPages);
    }
    
    return pages;
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DieraHeader />
      <main className="flex-1 px-2 sm:px-3 py-3 max-w-[1600px] mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-light italic mb-0.5">New In</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {loading ? 'Loading...' : `Showing ${startIndex + 1}-${Math.min(endIndex, totalItems)} of ${totalItems} items`}
            </p>
          </div>
          
          {/* Items per page filter */}
          {!loading && totalItems > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor="itemsPerPage" className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                Items per page:
              </label>
              <select
                id="itemsPerPage"
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                className="h-7 rounded border border-input bg-background px-2 text-[10px] sm:text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value={20}>20</option>
                <option value={40}>40</option>
                <option value={60}>60</option>
              </select>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <p className="text-[10px] sm:text-xs text-muted-foreground">Loading latest products...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {currentItems.map((p) => (
                <Link key={p.id} to={`/product/${p.slug}`} className="group">
                  <div className="aspect-[2/3] bg-muted rounded overflow-hidden mb-1 relative">
                    {isNewProduct(p.created_at || p.createdAt) && <NewBadge />}
                    {p.images?.[0] && (
                      <img 
                        src={p.images[0]} 
                        alt={p.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                    )}
                  </div>
                  <p className="text-xs sm:text-sm font-light mb-0.5 line-clamp-1">{p.name}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{formatNPR(p.price_npr ?? p.price)}</p>
                  {p.colors?.length > 0 && (
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                      {p.colors.length} {p.colors.length === 1 ? 'color' : 'colors'}
                    </p>
                  )}
                </Link>
              ))}
              {currentItems.length === 0 && (
                <div className="col-span-full text-center py-10">
                  <p className="text-[10px] sm:text-xs text-muted-foreground">No products available yet.</p>
                  <Link to="/" className="text-primary hover:underline text-[10px] sm:text-xs mt-2 inline-block">
                    Return to home
                  </Link>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 mt-4">
                {/* Previous button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-7 w-7 p-0"
                >
                  <ChevronLeft className="w-3 h-3" />
                </Button>

                {/* Page numbers */}
                {getPageNumbers().map((page, index) => (
                  page === '...' ? (
                    <span key={`ellipsis-${index}`} className="px-1 text-[10px] text-muted-foreground">
                      ...
                    </span>
                  ) : (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => goToPage(page as number)}
                      className="h-7 min-w-7 px-1.5 text-[10px]"
                    >
                      {page}
                    </Button>
                  )
                ))}

                {/* Next button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-7 w-7 p-0"
                >
                  <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default NewIn;
