import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Category {
  _id: string;
  name: string;
  slug: string;
}

const Footer = () => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await api.get<Category[]>("/categories");
        setCategories(data);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
  }, []);

  return (
    <footer className="w-full bg-white text-black pt-12 pb-2 px-6 border-t border-[#e5e5e5]">
      <div className="">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-8">
          {/* Brand - Left side */}
          <div>
            <img 
              src="/diera_shop.svg" 
              alt="Di-Era Shop" 
              className="h-36 w-auto -ml-12 -mb-5"
            />
            <p className="text-sm font-light text-black/70 leading-relaxed max-w-md mb-6">
              Timeless fashion curated for the effortlessly stylish
            </p>
            
            {/* Contact Information */}
            <div className="space-y-2 text-sm font-light text-black/70">
              <div>
                <p className="font-normal text-black mb-1">Visit Us</p>
                <p>Opp to Bricks Cafe</p>
              </div>
              <div>
                <p className="font-normal text-black mb-1 mt-3">Contact</p>
                <p><a href="tel:+9779981234567">+977 9981234567</a></p>
              </div>
            </div>
          </div>

          {/* Link lists - Right side */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Shop */}
            <div>
              <h4 className="text-sm font-normal mb-4">Shop</h4>
              <ul className="space-y-2">
                <li><Link to="/category/new-in" className="text-sm font-light text-black/70 hover:text-black transition-colors">New In</Link></li>
                {categories.map((category) => (
                  <li key={category._id}>
                    <Link 
                      to={`/category/${category.slug}`} 
                      className="text-sm font-light text-black/70 hover:text-black transition-colors"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-sm font-normal mb-4">Support</h4>
              <ul className="space-y-2">
                <li><Link to="/about/customer-care" className="text-sm font-light text-black/70 hover:text-black transition-colors">Care Instructions</Link></li>
                <li><Link to="/about/customer-care" className="text-sm font-light text-black/70 hover:text-black transition-colors">Returns</Link></li>
                <li><Link to="/about/customer-care" className="text-sm font-light text-black/70 hover:text-black transition-colors">Shipping</Link></li>
                <li><Link to="/about/customer-care" className="text-sm font-light text-black/70 hover:text-black transition-colors">Contact</Link></li>
              </ul>
            </div>

            {/* Connect */}
            <div>
              <h4 className="text-sm font-normal mb-4">Connect</h4>
              <ul className="space-y-2">
                <li><a href="https://www.instagram.com/_diera_shop_/" target="_blank" rel="noopener noreferrer" className="text-sm font-light text-black/70 hover:text-black transition-colors">Instagram</a></li>
                <li><a href="https://www.tiktok.com/@_diera_shop_" target="_blank" rel="noopener noreferrer" className="text-sm font-light text-black/70 hover:text-black transition-colors">Tiktok</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom section - edge to edge separator */}
      <div className="border-t border-[#e5e5e5] -mx-6 px-6 pt-2">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm font-light text-black mb-1 md:mb-0">
            © 2026 Diera. All rights reserved. Diera Shop.
          </p>
          <div className="flex space-x-6">
            <Link to="/privacy-policy" className="text-sm font-light text-black hover:text-black/70 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms-of-service" className="text-sm font-light text-black hover:text-black/70 transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;