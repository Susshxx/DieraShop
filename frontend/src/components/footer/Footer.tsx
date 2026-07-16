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
    const fetchCategories = async () => {
      try {
        const data = await api.get<Category[]>(`/categories?t=${Date.now()}`);
        // Filter to show only categories with showInFooter enabled
        const filtered = data.filter((c) => {
          const val = c.showInFooter ?? c.show_in_footer;
          return val === true || val === 1;
        });
        console.log('Footer categories (filtered by showInFooter):', filtered);
        setCategories(filtered);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
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
                <p>Bricks Cafe Building</p>
              </div>
              <div>
                <p className="font-normal text-foreground mb-1 mt-3">Contact</p>
                <p><a href="tel:+9779981234567" className="hover:text-primary transition-colors">+977 981234567</a></p>
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