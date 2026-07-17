import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Category {
  _id: string;
  name: string;
  slug: string;
  showInFooter?: boolean;
  show_in_footer?: boolean;
}

const Footer = () => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const CACHE_KEY = 'diera-footer-categories';
    const CACHE_TIMESTAMP_KEY = 'diera-footer-categories-timestamp';

    // Fetch categories from API
    api.get<Category[]>('/categories')
      .then((data) => {
        // Filter to show only categories with showInFooter enabled
        const filtered = data.filter((c) => {
          const val = c.showInFooter ?? c.show_in_footer;
          return val === true;
        });
        
        console.log('Footer categories fetched (filtered by showInFooter):', filtered);
        setCategories(filtered);
        
        // Save to localStorage after successful fetch
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
      })
      .catch((error) => {
        console.error("Failed to fetch categories:", error);
        
        // If fetch fails, try to use cached data as fallback
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
          try {
            const data: Category[] = JSON.parse(cachedData);
            const filtered = data.filter((c) => {
              const val = c.showInFooter ?? c.show_in_footer;
              return val === true;
            });
            setCategories(filtered);
            console.log('Using cached footer categories as fallback');
          } catch (e) {
            console.error('Failed to parse cached categories:', e);
          }
        }
      });
  }, []);

  return (
    <footer className="w-full bg-background text-foreground pt-0 pb-1 px-6 border-t border-border">
      <div className="">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-8">
          {/* Brand - Left side */}
          <div>
            {/* Inline SVG so fill tracks the CSS --primary variable */}
            <svg
              width="500" height="200" viewBox="0 0 500 200"
              xmlns="http://www.w3.org/2000/svg"
              className="h-36 w-auto -ml-12 -mb-12 -mt-6"
              aria-label="Di-Era Shop"
            >
              <text
                x="250" y="115"
                textAnchor="middle"
                fontFamily="Georgia, 'Times New Roman', serif"
                fontWeight="700"
                fontSize="58"
                fill="hsl(var(--primary))"
                letterSpacing="-1"
              >Di -Era Shop</text>
            </svg>
            <p className="text-sm font-light text-muted-foreground leading-relaxed max-w-md mb-6">
              Timeless fashion curated for the effortlessly stylish
            </p>
            
            {/* Contact Information */}
            <div className="space-y-2 text-sm font-light text-muted-foreground">
              <div>
                <p className="font-normal text-foreground mb-1">Visit Us</p>
                <p>
                  <a href="https://www.google.com/maps/place/Diera+Shop/@27.6857461,85.3151812,17z/data=!3m1!4b1!4m6!3m5!1s0x39eb19298aade4ab:0xdc5d8b46291c4f7d!8m2!3d27.6857414!4d85.3177561!16s%2Fg%2F11zcy31k6n?entry=ttu&g_ep=EgoyMDI2MDcxNC4wIKXMDSoASAFQAw%3D%3D" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                    Diera Shop
                  </a>
                  {" "}
                  <span className="text-xs text-muted-foreground">(Get Directions)</span>
                </p>
              </div>
              <div>
                <p className="font-normal text-foreground mb-1 mt-3">Contact</p>
                <p><a href="tel:+9779818276861" className="hover:text-primary transition-colors">+977 9818276861</a></p>
              </div>
            </div>
          </div>

          {/* Link lists - Right side */}
          <div className="grid grid-cols-3 gap-8">
            {/* Shop */}
            <div>
              <h4 className="text-sm font-normal mb-4 sm:mt-8 text-foreground">Shop</h4>
              <ul className="space-y-2">
                <li><Link to="/category/new-in" className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">New In</Link></li>
                {categories.map((category) => (
                  <li key={category._id}>
                    <Link 
                      to={`/category/${category.slug}`} 
                      className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* About */}
            <div>
              <h4 className="text-sm font-normal mb-4 sm:mt-8 text-foreground">About</h4>
              <ul className="space-y-2">
                <li><Link to="/about/our-story" className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">Our Story</Link></li>
                <li><Link to="/about/sustainability" className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">Sustainability</Link></li>
                <li><Link to="/about/store-locator" className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">Store Locator</Link></li>
              </ul>
            </div>

            {/* Connect */}
            <div>
              <h4 className="text-sm font-normal mb-4 sm:mt-8 text-foreground">Connect</h4>
              <ul className="space-y-2">
                <li><Link to="/about/customer-care" className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">Contact Us</Link></li>
                <li><a href="https://www.instagram.com/_diera_shop_/" target="_blank" rel="noopener noreferrer" className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">Instagram</a></li>
                <li><a href="https://www.tiktok.com/@_diera_shop_" target="_blank" rel="noopener noreferrer" className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">Tiktok</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom section - edge to edge separator */}
      <div className="border-t border-border -mx-6 px-6 pt-2">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm font-light text-foreground mb-1 md:mb-0">
            © 2026 Diera. All rights reserved. Diera Shop.
          </p>
          <div className="flex space-x-6">
            <Link to="/privacy-policy" className="text-sm font-light text-foreground hover:text-muted-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms-of-service" className="text-sm font-light text-foreground hover:text-muted-foreground transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;